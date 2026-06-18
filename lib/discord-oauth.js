import crypto from "node:crypto";


export const DISCORD_OAUTH_STATE_COOKIE = "tradeops_discord_oauth_state";
export const DISCORD_SESSION_COOKIE = "tradeops_discord_session";
const DISCORD_OAUTH_CALLBACK_PATH = "/discord/oauth/complete";
const DISCORD_OAUTH_SCOPES = ["identify", "email", "guilds.join"];
const DISCORD_OAUTH_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";


function clean(value) {
  return String(value || "").trim();
}


function encodeState(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}


function decodeState(value) {
  const normalized = clean(value);
  if (!normalized) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(normalized, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}


function normalizeRelativePath(value, fallback = "/join") {
  const candidate = clean(value);
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  return candidate;
}


export function getDiscordOAuthRedirectUri({
  env = process.env,
  origin = "https://tradeops.org",
} = {}) {
  return clean(env.TRADEOPS_DISCORD_OAUTH_REDIRECT_URI) || `${origin.replace(/\/+$/, "")}${DISCORD_OAUTH_CALLBACK_PATH}`;
}


export function getDiscordOAuthConfig({
  env = process.env,
  origin = "https://tradeops.org",
} = {}) {
  return {
    clientId: clean(env.TRADEOPS_DISCORD_CLIENT_ID),
    redirectUri: getDiscordOAuthRedirectUri({ env, origin }),
    scopes: [...DISCORD_OAUTH_SCOPES],
  };
}


export function buildDiscordOAuthStartState({
  returnTo = "/join",
}) {
  return {
    nonce: crypto.randomBytes(18).toString("base64url"),
    returnTo: normalizeRelativePath(returnTo),
    createdAt: new Date().toISOString(),
  };
}


function mergePathWithParams(basePath, params) {
  const target = new URL(basePath, "https://tradeops.org");
  for (const [key, value] of params.entries()) {
    if (!clean(value)) {
      continue;
    }
    target.searchParams.set(key, value);
  }
  return `${target.pathname}${target.search}${target.hash}`;
}


export function resolveDiscordOAuthReturnTo(url) {
  const currentUrl = url instanceof URL ? url : new URL(String(url), "https://tradeops.org");
  const rawReturnTo = currentUrl.searchParams.get("return_to");
  const basePath = normalizeRelativePath(rawReturnTo || "/join");
  const passthrough = new URLSearchParams();

  for (const [key, value] of currentUrl.searchParams.entries()) {
    if (key === "return_to") {
      continue;
    }
    passthrough.append(key, value);
  }

  return mergePathWithParams(basePath, passthrough);
}


export function buildDiscordOAuthAuthorizeUrl({
  clientId,
  redirectUri,
  state,
  scopes = DISCORD_OAUTH_SCOPES,
}) {
  if (!clean(clientId)) {
    throw new Error("Discord OAuth client id is not configured.");
  }
  if (!clean(redirectUri)) {
    throw new Error("Discord OAuth redirect URI is not configured.");
  }
  if (!clean(state)) {
    throw new Error("Discord OAuth state is required.");
  }

  const url = new URL(DISCORD_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("client_id", clean(clientId));
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", clean(state));
  url.searchParams.set("redirect_uri", clean(redirectUri));
  url.searchParams.set("prompt", "consent");
  return url.toString();
}


export function serializeDiscordOAuthStateCookie(state) {
  return encodeState(state);
}


export function parseDiscordOAuthStateCookie(value) {
  const parsed = decodeState(value);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return {
    nonce: clean(parsed.nonce),
    returnTo: normalizeRelativePath(parsed.returnTo),
    createdAt: clean(parsed.createdAt),
  };
}


export function buildDiscordOAuthRedirectTarget(returnTo, params = {}) {
  const target = new URL(normalizeRelativePath(returnTo), "https://tradeops.org");
  for (const [key, value] of Object.entries(params || {})) {
    if (!clean(value)) {
      continue;
    }
    target.searchParams.set(key, clean(value));
  }
  return `${target.pathname}${target.search}${target.hash}`;
}


export function serializeDiscordSession(session) {
  return encodeState({
    userId: clean(session?.userId),
    username: clean(session?.username),
    globalName: clean(session?.globalName),
    email: clean(session?.email).toLowerCase(),
    avatarUrl: clean(session?.avatarUrl),
    connectedAt: clean(session?.connectedAt) || new Date().toISOString(),
  });
}


export function parseDiscordSession(value) {
  const parsed = decodeState(value);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const userId = clean(parsed.userId);
  if (!userId) {
    return null;
  }
  return {
    userId,
    username: clean(parsed.username),
    globalName: clean(parsed.globalName),
    email: clean(parsed.email).toLowerCase(),
    avatarUrl: clean(parsed.avatarUrl),
    connectedAt: clean(parsed.connectedAt),
  };
}
