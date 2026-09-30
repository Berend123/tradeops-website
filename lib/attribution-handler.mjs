import { normalizeAttributionEventPayload } from "./attribution-payload.mjs";

export async function handleAttributionEvent(payload, { backendConfigured, forward, store }) {
  const normalized = normalizeAttributionEventPayload(payload);
  if (!normalized.ok) return { status: 400, body: { ok: false, error: normalized.error } };

  if (backendConfigured) {
    const result = await forward(normalized.payload);
    if (!result.networkError && result.status < 500) {
      return { status: result.status, body: result.body };
    }
  }

  try {
    const saved = await store(normalized.payload);
    return { status: 200, body: {
      ok: true, stored: "neon", forwarded_to_conversion_api: false,
      event_id: saved.eventId, duplicate: saved.duplicate,
    } };
  } catch {
    return { status: 502, body: { ok: false, error: "Attribution storage is unavailable." } };
  }
}
