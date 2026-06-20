import { NextResponse } from "next/server";

import { applyMemberSessionCookie, consumeMemberMagicLinkToken } from "../../../../lib/member-auth";


export async function GET(request) {
  try {
    const url = new URL(request.url);
    const result = await consumeMemberMagicLinkToken(url.searchParams.get("token") || "");
    const redirectTo = new URL(result.redirectTo, url.origin);
    const response = NextResponse.redirect(redirectTo, { status: 302 });
    applyMemberSessionCookie(response, result.sessionToken, request.url);
    return response;
  } catch (error) {
    const url = new URL(request.url);
    const message = error instanceof Error ? error.message : "Login verification failed.";
    const redirectTo = new URL(`/login?error=${encodeURIComponent(message)}`, url.origin);
    return NextResponse.redirect(redirectTo, { status: 302 });
  }
}
