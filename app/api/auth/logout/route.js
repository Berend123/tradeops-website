import { NextResponse } from "next/server";

import { clearMemberSessionCookie, MEMBER_SESSION_COOKIE } from "../../../../lib/member-auth";
import { deleteAuthSessionByHash, hashOpaqueToken } from "../../../../lib/member-db";
import { DISCORD_SESSION_COOKIE } from "../../../../lib/discord-oauth";


export async function POST(request) {
  const rawSessionToken = request.cookies.get(MEMBER_SESSION_COOKIE)?.value || "";
  if (rawSessionToken) {
    await deleteAuthSessionByHash(hashOpaqueToken(rawSessionToken));
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearMemberSessionCookie(response, request.url);
  response.cookies.set(DISCORD_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: request.url.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
