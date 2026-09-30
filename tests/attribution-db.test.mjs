import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAttributionEventPayload } from "../lib/attribution-payload.mjs";


test("normalizeAttributionEventPayload supplies an id and preserves attribution fields", () => {
  const result = normalizeAttributionEventPayload({
    event_type: "landing_page_view",
    atid: "affiliate-42",
    first_touch_atid: "first",
    metadata: { page_type: "home" },
  });

  assert.equal(result.ok, true);
  assert.match(result.payload.event_id, /^event_[0-9a-f-]{36}$/);
  assert.equal(result.payload.atid, "affiliate-42");
  assert.deepEqual(result.payload.metadata, { page_type: "home" });
});


test("normalizeAttributionEventPayload rejects invalid and oversized events", () => {
  assert.deepEqual(normalizeAttributionEventPayload(null), {
    ok: false,
    error: "Payload must be a JSON object.",
  });
  assert.deepEqual(normalizeAttributionEventPayload({ metadata: [] }), {
    ok: false,
    error: "event_type is required.",
  });
  assert.equal(normalizeAttributionEventPayload({ event_type: 42 }).ok, false);
  assert.equal(normalizeAttributionEventPayload({ event_type: "custom", timestamp: "nope" }).ok, false);
  assert.equal(normalizeAttributionEventPayload({ event_type: "custom", event_id: 42 }).ok, false);
  assert.equal(normalizeAttributionEventPayload({ event_type: "custom", event_id: "x".repeat(201) }).ok, false);
  assert.equal(
    normalizeAttributionEventPayload({
      event_type: "custom",
      metadata: { text: "x".repeat(16 * 1024) },
    }).ok,
    false,
  );
});


test("normalizeAttributionEventPayload keeps a supplied event id for idempotent inserts", () => {
  const result = normalizeAttributionEventPayload({
    event_id: "synthetic-event-1",
    event_type: "landing_page_view",
  });

  assert.equal(result.ok, true);
  assert.equal(result.payload.event_id, "synthetic-event-1");
});
