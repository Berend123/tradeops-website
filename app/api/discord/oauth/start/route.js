import { NextResponse } from "next/server";

import {
  buildDiscordOAuthAuthorizeUrl,
  buildDiscordOAuthStartState,
  DISCORD_OAUTH_STATE_COOKIE,
  getDiscordOAuthConfig,
  resolveDiscordOAuthReturnTo,
  serializeDiscordOAuthStateCookie,
} from "../../../../../lib/discord-oauth";


export async function GET(request) {
  const origin = new URL(request.url).origin;
  const useSecureCookies = origin.startsWith("https://");
  const config = getDiscordOAuthConfig({ origin });
  if (!config.clientId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Discord OAuth client id is not configured.",
      },
      { status: 500 },
    );
  }

  const returnTo = resolveDiscordOAuthReturnTo(request.url);
  const state = buildDiscordOAuthStartState({ returnTo });
  const authorizeUrl = buildDiscordOAuthAuthorizeUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state: state.nonce,
    scopes: config.scopes,
  });

  const response = NextResponse.redirect(authorizeUrl, { status: 302 });
  response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, serializeDiscordOAuthStateCookie(state), {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
