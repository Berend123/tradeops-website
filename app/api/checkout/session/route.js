import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createLemonCheckoutSession } from "../../../../lib/lemon-squeezy";
import {
  getConfiguredConversionApiBaseUrl,
  requestConversionApi,
  shouldFallbackToDirect,
} from "../../../../lib/conversion-api";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../../../lib/discord-oauth";


function shouldFallbackFromCheckoutProxy(result) {
  if (shouldFallbackToDirect(result)) {
    return true;
  }
  const errorMessage = typeof result?.body?.error === "string" ? result.body.error : "";
  return result?.status === 422 && errorMessage.includes("Lemon Squeezy request failed");
}


export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const cookieStore = await cookies();
  const discordSession = parseDiscordSession(cookieStore.get(DISCORD_SESSION_COOKIE)?.value || "");
  const normalizedPayload = payload && typeof payload === "object" && !Array.isArray(payload)
    ? {
        ...payload,
        discord_user_id: payload.discord_user_id || discordSession?.userId || "",
        username: payload.username || discordSession?.globalName || discordSession?.username || "",
      }
    : payload;
  const proxied = getConfiguredConversionApiBaseUrl()
    ? await requestConversionApi({
        path: "/api/checkout/session",
        payload: normalizedPayload,
      })
    : null;
  const fallbackFromProxy = shouldFallbackFromCheckoutProxy(proxied);
  if (proxied && !fallbackFromProxy) {
    return NextResponse.json(proxied.body, { status: proxied.status });
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createLemonCheckoutSession({ payload: normalizedPayload, origin });
    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch (error) {
    const fallbackBody = {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout is not configured yet.",
      fallback_mode: "direct_lemon_squeezy",
    };
    if (proxied?.body?.error && !proxied.networkError) {
      if (fallbackFromProxy) {
        return NextResponse.json(fallbackBody, { status: 400 });
      }
      return NextResponse.json(proxied.body, { status: proxied.status });
    }
    return NextResponse.json(fallbackBody, { status: 400 });
  }
}
