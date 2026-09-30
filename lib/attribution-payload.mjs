import crypto from "node:crypto";


export const MAX_EVENT_JSON_BYTES = 32 * 1024;
export const MAX_METADATA_JSON_BYTES = 16 * 1024;
export const MAX_EVENT_TYPE_LENGTH = 100;
export const MAX_EVENT_ID_LENGTH = 200;
export const MAX_FIELD_LENGTH = 500;


function clean(value, maxLength = MAX_FIELD_LENGTH) {
  return String(value ?? "").trim().slice(0, maxLength);
}


function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}


function jsonByteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}


export function normalizeAttributionEventPayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }
  if (payload.event_type !== undefined && typeof payload.event_type !== "string") {
    return { ok: false, error: "event_type must be a string." };
  }
  const eventType = clean(payload.event_type, MAX_EVENT_TYPE_LENGTH);
  if (!eventType) {
    return { ok: false, error: "event_type is required." };
  }
  if (typeof payload.event_type === "string" && payload.event_type.trim().length > MAX_EVENT_TYPE_LENGTH) {
    return { ok: false, error: "event_type is too long." };
  }
  if (payload.event_id !== undefined && typeof payload.event_id !== "string") {
    return { ok: false, error: "event_id must be a string." };
  }
  if (typeof payload.event_id === "string" && payload.event_id.trim().length > MAX_EVENT_ID_LENGTH) {
    return { ok: false, error: "event_id is too long." };
  }
  if (payload.metadata !== undefined && !isPlainObject(payload.metadata)) {
    return { ok: false, error: "metadata must be a JSON object." };
  }
  if (payload.metadata !== undefined && jsonByteLength(payload.metadata) > MAX_METADATA_JSON_BYTES) {
    return { ok: false, error: "metadata is too large." };
  }
  if (payload.timestamp !== undefined && payload.timestamp !== "") {
    if (typeof payload.timestamp !== "string" || Number.isNaN(Date.parse(payload.timestamp))) {
      return { ok: false, error: "timestamp must be a valid date string." };
    }
  }

  const normalized = {
    ...payload,
    event_id: clean(payload.event_id, MAX_EVENT_ID_LENGTH) || `event_${crypto.randomUUID()}`,
    event_type: eventType,
    atid: clean(payload.atid),
    first_touch_atid: clean(payload.first_touch_atid),
    last_touch_atid: clean(payload.last_touch_atid),
    anonymous_id: clean(payload.anonymous_id),
    source: clean(payload.source),
    campaign: clean(payload.campaign),
    page: clean(payload.page),
    referrer: clean(payload.referrer),
    timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : "",
    affiliate_code: clean(payload.affiliate_code),
    metadata: payload.metadata || {},
  };
  if (jsonByteLength(normalized) > MAX_EVENT_JSON_BYTES) {
    return { ok: false, error: "Attribution event is too large." };
  }
  return { ok: true, payload: normalized };
}
