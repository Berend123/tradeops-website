import { NextResponse } from "next/server";

import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../../../lib/discord-oauth";
import {
  applyMemberSessionCookie,
  createMemberSessionForUserId,
  sanitizeInternalRedirectPath,
} from "../../../../lib/member-auth";
import { claimTradeopsProAccess } from "../../../../lib/member-subscriptions";


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
    const session = parseDiscordSession(request.cookies.get(DISCORD_SESSION_COOKIE)?.value || "");
    const email = String(payload.email || "").trim().toLowerCase();
    const discordUserId = String(session?.userId || payload.discord_user_id || "").trim();
    const redirectTo = sanitizeInternalRedirectPath(payload.redirect_to || "/dashboard");

    if (!discordUserId) {
      throw new Error("Connect Discord before claiming Pro access.");
    }
    const activation = await claimTradeopsProAccess({
      email,
      discordUserId,
      discordUsername: session?.username || "",
      discordGlobalName: session?.globalName || "",
    });
    const memberSession = await createMemberSessionForUserId(activation.user.id);
    const response = NextResponse.json(
      {
        ok: true,
        email,
        redirect_to: redirectTo,
        discord_user_id: discordUserId,
        entitlement_source: activation.source,
        already_active: Boolean(activation.roleSync?.result?.already_active),
        subscription: activation.access.subscription
          ? {
              id: activation.access.subscription.id,
              status: activation.access.subscription.status,
              product_name: activation.access.subscription.planName,
              variant_name: activation.access.subscription.variantId,
              customer_portal_url: activation.access.subscription.customerPortalUrl,
            }
          : undefined,
        premium_role: activation.roleSync?.result?.premium_role,
        channel_sync: activation.roleSync?.result?.channel_sync,
      },
      { status: 200 },
    );
    applyMemberSessionCookie(response, memberSession.sessionToken, request.url);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discord activation failed.";
    const status =
      /required|must be|connect discord/i.test(message) ? 400 :
      /already linked/i.test(message) ? 409 :
      /not found|join the server first/i.test(message) ? 404 :
      /no active tradeops subscription/i.test(message) ? 404 :
      500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}
