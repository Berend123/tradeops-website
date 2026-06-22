import crypto from "node:crypto";

import { cookies } from "next/headers";

import {
  createAuthSession,
  deleteAuthSessionByHash,
  getAuthSessionByHash,
  getUserById,
  hashOpaqueToken,
  isMemberDatabaseConfigured,
  touchAuthSession,
} from "./member-db.js";

export const MEMBER_SESSION_COOKIE = "tradeops_member_session";
export const DEFAULT_MEMBER_LOGIN_REDIRECT = "/dashboard";

const SESSION_TTL_DAYS = 30;


function clean(value) {
  return String(value || "").trim();
}


function buildSessionExpiry(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}


function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
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
