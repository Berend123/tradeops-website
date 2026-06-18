import { NextResponse } from "next/server";


export function trimTrailingSlash(value) {
  return (value || "").replace(/\/+$/, "");
}


export function getConfiguredConversionApiBaseUrl() {
  return (
    trimTrailingSlash(process.env.TRADEOPS_CONVERSION_API_BASE_URL) ||
    trimTrailingSlash(process.env.NEXT_PUBLIC_CONVERSION_API_BASE_URL) ||
    ""
  );
}


export function getConversionApiBaseUrl() {
  return getConfiguredConversionApiBaseUrl() || "http://127.0.0.1:8011";
}


export async function requestConversionApi({
  path,
  payload = null,
  headers = {},
  method = "POST",
  rawBody = null,
  validatePayload = true,
}) {
  if (validatePayload && (!payload || typeof payload !== "object" || Array.isArray(payload))) {
    return {
      ok: true,
      networkError: false,
      status: 400,
      body: { ok: false, error: "Payload must be a JSON object." },
    };
  }
  const targetUrl = `${getConversionApiBaseUrl()}${path}`;
  try {
    const response = await fetch(targetUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: rawBody ?? JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({
      ok: false,
      error: `Conversion API returned status ${response.status}.`,
    }));
    return {
      ok: true,
      networkError: false,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      networkError: true,
      status: 502,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : "Conversion API is unavailable.",
      },
    };
  }
}


export function shouldFallbackToDirect(result) {
  return !result || result.networkError || result.status >= 500;
}


export async function proxyConversionRequest(options) {
  const result = await requestConversionApi(options);
  return NextResponse.json(result.body, { status: result.status });
}
