import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTrackedHref,
  buildWebsiteEventPayload,
  getPageViewEventType,
  initializeAttributionState,
} from "../lib/attribution-state.mjs";


test("initializeAttributionState preserves first touch and updates last touch", () => {
  const state = initializeAttributionState({
    search: "?atid=last123&src=x&campaign=reply_queue&content_type=reply_queue_reply",
    pathname: "/pricing",
    referrer: "https://x.com/TradeOpsHQ/status/1",
    localState: {
      firstTouchAtid: "first999",
      firstTouchSource: "x",
      firstTouchCampaign: "watchlist_daily",
      firstTouchContentType: "watchlist_post",
      anonymousId: "anon_saved",
      firstSeenAt: "2026-06-15T08:00:00.000Z",
    },
    nowIso: "2026-06-16T10:00:00.000Z",
  });

  assert.equal(state.firstTouchAtid, "first999");
  assert.equal(state.lastTouchAtid, "last123");
  assert.equal(state.currentAtid, "last123");
  assert.equal(state.firstTouchCampaign, "watchlist_daily");
  assert.equal(state.lastTouchCampaign, "reply_queue");
  assert.equal(state.anonymousId, "anon_saved");
});


test("buildTrackedHref preserves attribution query params across navigation", () => {
  const href = buildTrackedHref("/join", {
    currentAtid: "abc123",
    firstTouchAtid: "ft1",
    lastTouchAtid: "lt2",
    lastTouchSource: "x",
    lastTouchCampaign: "reply_queue",
    lastTouchContentType: "reply_queue_reply",
  });

  assert.equal(
    href,
    "/join?atid=abc123&first_touch_atid=ft1&last_touch_atid=lt2&src=x&campaign=reply_queue&content_type=reply_queue_reply",
  );
});

test("buildTrackedHref preserves existing query params on absolute links", () => {
  const href = buildTrackedHref("https://discord.gg/example?step=welcome", {
    currentAtid: "join123",
    firstTouchAtid: "ft1",
    lastTouchAtid: "lt2",
    lastTouchSource: "x",
    lastTouchCampaign: "premarket_flagship",
    lastTouchContentType: "watchlist_post",
  });

  assert.equal(
    href,
    "https://discord.gg/example?step=welcome&atid=join123&first_touch_atid=ft1&last_touch_atid=lt2&src=x&campaign=premarket_flagship&content_type=watchlist_post",
  );
});

test("getPageViewEventType uses join_page_view for the join route", () => {
  assert.equal(getPageViewEventType("join"), "join_page_view");
  assert.equal(getPageViewEventType("pricing"), "pricing_page_view");
  assert.equal(getPageViewEventType("home"), "landing_page_view");
});


test("buildWebsiteEventPayload includes first and last touch metadata", () => {
  const payload = buildWebsiteEventPayload({
    eventType: "checkout_button_click",
    state: {
      currentAtid: "abc123",
      firstTouchAtid: "ft1",
      lastTouchAtid: "lt2",
      anonymousId: "anon_123",
      lastTouchSource: "x",
      lastTouchCampaign: "pricing_campaign",
    },
    page: "/pricing",
    referrer: "https://tradeops.org/join",
    metadata: { button_name: "start_checkout" },
    planId: "tradeops_pro",
    planName: "TradeOps Pro",
  });

  assert.equal(payload.event_type, "checkout_button_click");
  assert.equal(payload.atid, "abc123");
  assert.equal(payload.first_touch_atid, "ft1");
  assert.equal(payload.last_touch_atid, "lt2");
  assert.equal(payload.source, "x");
  assert.equal(payload.campaign, "pricing_campaign");
  assert.equal(payload.plan_id, "tradeops_pro");
  assert.equal(payload.plan_name, "TradeOps Pro");
  assert.deepEqual(payload.metadata, { button_name: "start_checkout" });
});
