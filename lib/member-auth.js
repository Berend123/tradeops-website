import crypto from "node:crypto";

import { cookies } from "next/headers";

import {
  createAuthSession,
  createVerificationToken,
  deleteAuthSessionByHash,
  deleteVerificationTokenById,
  deleteVerificationTokensForEmail,
  getAuthSessionByHash,
  getUserById,
  getVerificationTokenByHash,
  getUserByEmail,
  hashOpaqueToken,
  isMemberDatabaseConfigured,
  markUserEmailVerified,
  normalizeEmail,
  touchAuthSession,
  upsertUserByEmail,
} from "./member-db.js";

export const MEMBER_SESSION_COOKIE = "tradeops_member_session";
export const DEFAULT_MEMBER_LOGIN_REDIRECT = "/dashboard";

const MAGIC_LINK_TTL_MINUTES = 30;
const SESSION_TTL_DAYS = 30;


function clean(value) {
  return String(value || "").trim();
}


function parseBoolean(value, defaultValue = false) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) {
    return defaultValue;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}


function buildFutureDate(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}


function buildSessionExpiry(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}


function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}


export function getMemberAuthConfig(env = process.env) {
  return {
    authSecret: clean(env.AUTH_SECRET),
    fromEmail: clean(env.AUTH_FROM_EMAIL),
    resendApiKey: clean(env.RESEND_API_KEY),
    allowPreviewLinks: parseBoolean(env.AUTH_ALLOW_PREVIEW_LINKS, env.NODE_ENV !== "production"),
  };
}


export function isMemberAuthConfigured(env = process.env) {
  return isMemberDatabaseConfigured(env);
}


export function sanitizeInternalRedirectPath(value, fallback = DEFAULT_MEMBER_LOGIN_REDIRECT) {
  const normalized = clean(value);
  if (!normalized) {
    return fallback;
  }
  if (!normalized.startsWith("/")) {
    return fallback;
  }
  if (normalized.startsWith("//")) {
    return fallback;
  }
  return normalized;
}


export function buildMagicLinkUrl({ origin, token }) {
  const normalizedOrigin = clean(origin).replace(/\/+$/, "");
  const normalizedToken = clean(token);
  if (!normalizedOrigin || !normalizedToken) {
    throw new Error("Origin and token are required.");
  }
  return `${normalizedOrigin}/api/auth/verify?token=${encodeURIComponent(normalizedToken)}`;
}


async function sendMagicLinkEmail({
  email,
  magicLinkUrl,
  env = process.env,
}) {
  const config = getMemberAuthConfig(env);
  if (!config.resendApiKey || !config.fromEmail) {
    if (config.allowPreviewLinks) {
      return {
        delivered: false,
        previewUrl: magicLinkUrl,
      };
    }
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [email],
      subject: "Your TradeOps login link",
      text: `Use this secure link to open your TradeOps account:\n\n${magicLinkUrl}\n\nThis link expires in ${MAGIC_LINK_TTL_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h1 style="font-size: 20px;">TradeOps login link</h1>
          <p>Use the secure link below to open your TradeOps account.</p>
          <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
          <p>This link expires in ${MAGIC_LINK_TTL_MINUTES} minutes.</p>
        </div>
      `,
    }),
  });
  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Magic-link email send failed (${response.status})${rawBody ? `: ${rawBody}` : ""}`);
  }

  return {
    delivered: true,
    previewUrl: "",
  };
}


export async function requestMemberMagicLink({
  email,
  redirectTo = DEFAULT_MEMBER_LOGIN_REDIRECT,
  origin,
  env = process.env,
}) {
  if (!isMemberAuthConfigured(env)) {
    throw new Error("Member login is not configured yet.");
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  const normalizedRedirect = sanitizeInternalRedirectPath(redirectTo);
  const user = await upsertUserByEmail({ email: normalizedEmail }, env);
  const rawToken = randomToken();
  const tokenHash = hashOpaqueToken(rawToken);

  await createVerificationToken(
    {
      email: normalizedEmail,
      tokenHash,
      redirectTo: normalizedRedirect,
      expiresAt: buildFutureDate(MAGIC_LINK_TTL_MINUTES),
    },
    env,
  );

  const magicLinkUrl = buildMagicLinkUrl({
    origin,
    token: rawToken,
  });
  const delivery = await sendMagicLinkEmail({
    email: normalizedEmail,
    magicLinkUrl,
    env,
  });

  return {
    ok: true,
    user,
    email: normalizedEmail,
    redirectTo: normalizedRedirect,
    magicLinkUrl: delivery.previewUrl || "",
    previewMode: Boolean(delivery.previewUrl),
  };
}


export async function consumeMemberMagicLinkToken(rawToken, env = process.env) {
  if (!isMemberAuthConfigured(env)) {
    throw new Error("Member login is not configured yet.");
  }
  const normalizedToken = clean(rawToken);
  if (!normalizedToken) {
    throw new Error("Login token is missing.");
  }

  const tokenHash = hashOpaqueToken(normalizedToken);
  const verificationRow = await getVerificationTokenByHash(tokenHash, env);
  if (!verificationRow) {
    throw new Error("This login link is invalid or has already been used.");
  }

  const expiresAtMs = Date.parse(clean(verificationRow.expires_at));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
    await deleteVerificationTokenById(verificationRow.id, env);
    throw new Error("This login link has expired.");
  }

  const user = await getUserByEmail(verificationRow.email_normalized, env);
  if (!user) {
    await deleteVerificationTokenById(verificationRow.id, env);
    throw new Error("No TradeOps account was found for this login link.");
  }

  await markUserEmailVerified(user.id, env);
  await deleteVerificationTokenById(verificationRow.id, env);
  await deleteVerificationTokensForEmail(verificationRow.email_normalized, env);

  const sessionToken = randomToken();
  const sessionHash = hashOpaqueToken(sessionToken);
  await createAuthSession(
    {
      userId: user.id,
      sessionHash,
      expiresAt: buildSessionExpiry(SESSION_TTL_DAYS),
    },
    env,
  );

  return {
    sessionToken,
    redirectTo: sanitizeInternalRedirectPath(verificationRow.redirect_to),
    user: await markUserEmailVerified(user.id, env),
  };
}


export async function createMemberSessionForUserId(userId, env = process.env) {
  if (!isMemberAuthConfigured(env)) {
    throw new Error("Member login is not configured yet.");
  }

  const user = await getUserById(userId, env);
  if (!user) {
    throw new Error("No TradeOps account was found for this session.");
  }

  const sessionToken = randomToken();
  const sessionHash = hashOpaqueToken(sessionToken);
  await createAuthSession(
    {
      userId: user.id,
      sessionHash,
      expiresAt: buildSessionExpiry(SESSION_TTL_DAYS),
    },
    env,
  );

  return {
    sessionToken,
    user,
  };
}


export async function getCurrentMemberSession(env = process.env) {
  if (!isMemberAuthConfigured(env)) {
    return null;
  }

  const cookieStore = await cookies();
  const rawSessionToken = cookieStore.get(MEMBER_SESSION_COOKIE)?.value || "";
  const normalizedSessionToken = clean(rawSessionToken);
  if (!normalizedSessionToken) {
    return null;
  }

  const sessionHash = hashOpaqueToken(normalizedSessionToken);
  const row = await getAuthSessionByHash(sessionHash, env);
  if (!row) {
    return null;
  }

  const expiresAtMs = Date.parse(clean(row.expires_at));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
    await deleteAuthSessionByHash(sessionHash, env);
    return null;
  }

  await touchAuthSession(clean(row.id), clean(row.user_id), env);
  return {
    sessionId: clean(row.id),
    userId: clean(row.user_id),
    email: clean(row.email),
    emailNormalized: clean(row.email_normalized),
    emailVerifiedAt: clean(row.email_verified_at),
    lastLoginAt: clean(row.last_login_at),
    sessionExpiresAt: clean(row.expires_at),
    sessionToken: normalizedSessionToken,
  };
}


export function applyMemberSessionCookie(response, sessionToken, requestUrl) {
  const normalizedToken = clean(sessionToken);
  if (!normalizedToken) {
    throw new Error("Session token is required.");
  }
  const useSecureCookies = clean(requestUrl).startsWith("https://");
  response.cookies.set(MEMBER_SESSION_COOKIE, normalizedToken, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
  return response;
}


export function clearMemberSessionCookie(response, requestUrl) {
  const useSecureCookies = clean(requestUrl).startsWith("https://");
  response.cookies.set(MEMBER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
