import { NextResponse } from "next/server";
import { syncDiscordProAccessFromLemonWebhook } from "../../../../../lib/discord-entitlements";
import { parseLemonWebhook, verifyLemonWebhookSignature } from "../../../../../lib/lemon-squeezy";
import { syncMembershipFromLemonWebhook } from "../../../../../lib/member-subscriptions";
import {
  getConfiguredConversionApiBaseUrl,
  getConversionApiBaseUrl,
  requestConversionApi,
  shouldFallbackToDirect,
} from "../../../../../lib/conversion-api";


export async function POST(request, { params }) {
  const provider = encodeURIComponent(params?.provider || "custom");
  const rawBody = await request.text();
  const secret = request.headers.get("x-tradeops-webhook-secret") || "";
  const signature = request.headers.get("x-signature") || "";
  const proxied = getConfiguredConversionApiBaseUrl()
    ? await requestConversionApi({
        path: `/api/checkout/webhook?provider=${provider}`,
        headers: {
          "Content-Type": request.headers.get("content-type") || "application/json",
          ...(secret ? { "x-tradeops-webhook-secret": secret } : {}),
          ...(signature ? { "x-signature": signature } : {}),
        },
        method: "POST",
        rawBody,
        validatePayload: false,
      })
    : null;
  if (proxied && !shouldFallbackToDirect(proxied)) {
    return NextResponse.json(proxied.body, { status: proxied.status });
  }

  try {
    if (provider !== "lemon_squeezy") {
      throw new Error(`Direct fallback is only supported for Lemon Squeezy webhooks. Received provider '${provider}'.`);
    }
    verifyLemonWebhookSignature({ rawBody, signature });
    const payload = parseLemonWebhook(rawBody);
    const eventName = String(payload?.meta?.event_name || payload?.event_name || payload?.type || "").trim();
    const dataType = String(payload?.data?.type || "").trim();
    const dataId = String(payload?.data?.id || "").trim();
    let membership = {
      attempted: false,
      reason: "not_processed",
    };
    try {
      membership = await syncMembershipFromLemonWebhook({
        payload,
      });
    } catch (membershipError) {
      membership = {
        attempted: true,
        ok: false,
        error: membershipError instanceof Error ? membershipError.message : "Membership sync failed.",
      };
    }
    let entitlement = {
      attempted: false,
      reason: "not_processed",
    };
    try {
      entitlement = await syncDiscordProAccessFromLemonWebhook({
        payload,
      });
    } catch (entitlementError) {
      entitlement = {
        attempted: true,
        ok: false,
        error: entitlementError instanceof Error ? entitlementError.message : "Discord entitlement sync failed.",
      };
    }
    console.log(
      JSON.stringify({
        level: "info",
        source: "tradeops_direct_lemon_webhook",
        provider,
        event_name: eventName,
        data_type: dataType,
        data_id: dataId,
        forwarded_to_conversion_api: false,
        fallback_reason: proxied?.body?.error || "conversion api unavailable",
        membership,
        entitlement,
      }),
    );
    return NextResponse.json(
      {
        ok: true,
        direct: true,
        provider,
        received: true,
        event_name: eventName,
        data_type: dataType,
        data_id: dataId,
        membership,
        entitlement,
        note: "Accepted directly because the conversion API backend is unavailable.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (proxied?.body?.error && !proxied.networkError) {
      return NextResponse.json(proxied.body, { status: proxied.status });
    }
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : `Direct ${getConversionApiBaseUrl()} webhook handling failed.`,
        fallback_mode: "direct_lemon_squeezy",
      },
      { status: 400 },
    );
  }
}
