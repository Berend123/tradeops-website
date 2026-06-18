import { NextResponse } from "next/server";

import { fetchDiscordUserProfile, joinDiscordGuildFromOAuth } from "../../../../../lib/discord-entitlements";
import {
  buildDiscordOAuthRedirectTarget,
  DISCORD_OAUTH_STATE_COOKIE,
  DISCORD_SESSION_COOKIE,
  parseDiscordOAuthStateCookie,
  serializeDiscordSession,
} from "../../../../../lib/discord-oauth";


export async function POST(request) {
  const origin = new URL(request.url).origin;
  const useSecureCookies = origin.startsWith("https://");
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload must be a JSON object.",
      },
      { status: 400 },
    );
  }

  const accessToken = String(payload.access_token || "").trim();
  const returnedState = String(payload.state || "").trim();
  const storedState = parseDiscordOAuthStateCookie(request.cookies.get(DISCORD_OAUTH_STATE_COOKIE)?.value || "");

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Discord OAuth access token is missing.",
      },
      { status: 400 },
    );
  }
  if (!storedState || !returnedState || storedState.nonce !== returnedState) {
    return NextResponse.json(
      {
        ok: false,
        error: "Discord OAuth state is invalid or expired.",
      },
      { status: 400 },
    );
  }

  try {
    const profile = await fetchDiscordUserProfile({
      accessToken,
    });
    const guildJoin = await joinDiscordGuildFromOAuth({
      accessToken,
      discordUserId: profile.userId,
    });

    const session = {
      userId: profile.userId,
      username: profile.username,
      globalName: profile.globalName,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      connectedAt: new Date().toISOString(),
    };

    const redirectTo = buildDiscordOAuthRedirectTarget(storedState.returnTo, {
      discord: "connected",
    });

    const response = NextResponse.json(
      {
        ok: true,
        redirect_to: redirectTo,
        session,
        guild_join: guildJoin,
      },
      { status: 200 },
    );
    response.cookies.set(DISCORD_SESSION_COOKIE, serializeDiscordSession(session), {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Discord OAuth finalize failed.",
      },
      { status: 400 },
    );
  }
}
