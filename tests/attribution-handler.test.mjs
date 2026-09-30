import test from "node:test";
import assert from "node:assert/strict";
import { handleAttributionEvent } from "../lib/attribution-handler.mjs";

const payload = { event_id: "test-event", event_type: "affiliate_page_view", timestamp: "2026-09-30T12:00:00+02:00" };
const unexpected = async () => { throw new Error("Unexpected call"); };

test("missing backend stores directly and normalizes timestamps", async () => {
  const result = await handleAttributionEvent(payload, {
    backendConfigured: false, forward: unexpected,
    store: async (event) => {
      assert.equal(event.timestamp, "2026-09-30T10:00:00.000Z");
      return { eventId: event.event_id, duplicate: false };
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.event_id, "test-event");
  assert.equal(result.body.stored, "neon");
});

test("network and server failures fall back to storage", async () => {
  for (const upstream of [{ networkError: true, status: 502 }, { networkError: false, status: 503 }]) {
    const result = await handleAttributionEvent(payload, {
      backendConfigured: true, forward: async () => upstream,
      store: async () => ({ eventId: payload.event_id, duplicate: true }),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.duplicate, true);
  }
});

test("successful and client-error backend responses remain authoritative", async () => {
  for (const status of [200, 400, 429]) {
    const body = { ok: status === 200 };
    const result = await handleAttributionEvent(payload, {
      backendConfigured: true, forward: async () => ({ status, body }), store: unexpected,
    });
    assert.deepEqual(result, { status, body });
  }
});

test("storage failures never return success or leak database errors", async () => {
  const result = await handleAttributionEvent(payload, {
    backendConfigured: false, forward: unexpected,
    store: async () => { throw new Error("private database details"); },
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.ok, false);
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("invalid events are rejected before either persistence path", async () => {
  const result = await handleAttributionEvent({ ...payload, timestamp: "invalid" }, {
    backendConfigured: true, forward: unexpected, store: unexpected,
  });
  assert.equal(result.status, 400);
});
