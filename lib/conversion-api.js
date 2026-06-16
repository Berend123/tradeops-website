import { NextResponse } from "next/server";


function trimTrailingSlash(value) {
  return (value || "").replace(/\/+$/, "");
}


export function getConversionApiBaseUrl() {
  return (
    trimTrailingSlash(process.env.TRADEOPS_CONVERSION_API_BASE_URL) ||
    trimTrailingSlash(process.env.NEXT_PUBLIC_CONVERSION_API_BASE_URL) ||
    "http://127.0.0.1:8011"
  );
}


export async function proxyConversionRequest({
  path,
  payload,
  headers = {},
  method = "POST",
}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, error: "Payload must be a JSON object." }, { status: 400 });
  }
  const targetUrl = `${getConversionApiBaseUrl()}${path}`;
  try {
    const response = await fetch(targetUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
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
