import { NextResponse } from "next/server";
import { getConversionApiBaseUrl } from "../../../../../lib/conversion-api";


export async function POST(request, { params }) {
  const provider = encodeURIComponent(params?.provider || "custom");
  const rawBody = await request.text();
  const secret = request.headers.get("x-tradeops-webhook-secret") || "";
  const signature = request.headers.get("x-signature") || "";
  try {
    const response = await fetch(`${getConversionApiBaseUrl()}/api/checkout/webhook?provider=${provider}`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
        ...(secret ? { "x-tradeops-webhook-secret": secret } : {}),
        ...(signature ? { "x-signature": signature } : {}),
      },
      body: rawBody,
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({
      ok: false,
      error: `Conversion API returned status ${response.status}.`,
    }));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Conversion API is unavailable.",
      },
      { status: 502 },
    );
  }
}
