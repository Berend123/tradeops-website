import { NextResponse } from "next/server";

import { storeAttributionEvent } from "../../../../lib/attribution-db";
import { handleAttributionEvent } from "../../../../lib/attribution-handler.mjs";
import {
  getConfiguredConversionApiBaseUrl,
  requestConversionApi,
} from "../../../../lib/conversion-api";


export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const result = await handleAttributionEvent(payload, {
    backendConfigured: Boolean(getConfiguredConversionApiBaseUrl()),
    forward: (event) => requestConversionApi({ path: "/api/attribution/event", payload: event }),
    store: storeAttributionEvent,
  });
  return NextResponse.json(result.body, { status: result.status });
}
