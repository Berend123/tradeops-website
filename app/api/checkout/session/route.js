import { NextResponse } from "next/server";

import { createLemonCheckoutSession } from "../../../../lib/lemon-squeezy";
import { requestConversionApi, shouldFallbackToDirect } from "../../../../lib/conversion-api";


export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const proxied = await requestConversionApi({
    path: "/api/checkout/session",
    payload,
  });
  if (!shouldFallbackToDirect(proxied)) {
    return NextResponse.json(proxied.body, { status: proxied.status });
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await createLemonCheckoutSession({ payload, origin });
    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch (error) {
    const fallbackBody = {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout is not configured yet.",
      fallback_mode: "direct_lemon_squeezy",
    };
    if (proxied.body?.error && !proxied.networkError) {
      return NextResponse.json(proxied.body, { status: proxied.status });
    }
    return NextResponse.json(fallbackBody, { status: 400 });
  }
}
