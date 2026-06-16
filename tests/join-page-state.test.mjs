import test from "node:test";
import assert from "node:assert/strict";

import { resolveJoinPageState } from "../lib/join-page-state.mjs";

test("resolveJoinPageState stays conservative without checkout confirmation metadata", () => {
  const result = resolveJoinPageState({
    atid: "75b9cf11e0",
    src: "x",
    campaign: "premarket_flagship",
    content_type: "watchlist_post",
  });

  assert.equal(result.checkoutConfirmed, false);
  assert.equal(result.confirmationKey, "");
  assert.equal(result.confirmationReference, "");
});

test("resolveJoinPageState marks access confirmed only when positive status and reference exist", () => {
  const result = resolveJoinPageState({
    checkout: "success",
    subscription_id: "sub_123",
    atid: "abc123",
  });

  assert.equal(result.checkoutConfirmed, true);
  assert.equal(result.confirmationKey, "checkout");
  assert.equal(result.confirmationReferenceKey, "subscription_id");
  assert.equal(result.confirmationReference, "sub_123");
});
