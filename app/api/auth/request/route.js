import { NextResponse } from "next/server";

import { requestMemberMagicLink, sanitizeInternalRedirectPath } from "../../../../lib/member-auth";


export async function POST(request) {
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

  try {
    const origin = new URL(request.url).origin;
    const result = await requestMemberMagicLink({
      email: payload.email || "",
      redirectTo: sanitizeInternalRedirectPath(payload.redirect_to || "/dashboard"),
      origin,
    });
    return NextResponse.json(
      {
        ok: true,
        email: result.email,
        redirect_to: result.redirectTo,
        preview_mode: result.previewMode,
        magic_link_url: result.magicLinkUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not send the login link.",
      },
      { status: 400 },
    );
  }
}
