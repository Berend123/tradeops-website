import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEmail } from "../lib/member-db.js";
import {
  deriveTradeopsProEntitlement,
  extractLemonWebhookDetails,
  hasActiveTradeopsProEntitlement,
} from "../lib/member-subscriptions.js";


test("normalizeEmail lowercases and trims the login email", () => {
  assert.equal(normalizeEmail("  Alpha@Example.com "), "alpha@example.com");
});


test("extractLemonWebhookDetails prefers subscription ids and customer email", () => {
  const details = extractLemonWebhookDetails({
    meta: {
      event_name: "subscription_updated",
      custom_data: {
        discord_user_id: "1515448552623702106",
      },
    },
    data: {
      id: "sub_123",
      type: "subscriptions",
      attributes: {
        user_email: "alpha@example.com",
        customer_id: "cus_1",
        status: "active",
        variant_id: "var_1",
        variant_name: "TradeOps Pro",
        renews_at: "2026-07-01T00:00:00Z",
      },
    },
  });

  assert.equal(details.email, "alpha@example.com");
  assert.equal(details.providerSubscriptionId, "sub_123");
  assert.equal(details.providerRef, "lemon_subscription:sub_123");
  assert.equal(details.discordUserId, "1515448552623702106");
});


test("deriveTradeopsProEntitlement keeps cancelled subscriptions active through the paid-through date", () => {
  const now = new Date("2026-06-20T10:00:00Z");
  const entitlement = deriveTradeopsProEntitlement(
    {
      eventName: "subscription_cancelled",
      status: "cancelled",
      endsAt: "2026-06-30T00:00:00Z",
    },
    now,
  );

  assert.equal(entitlement.status, "active");
  assert.equal(entitlement.expiresAt, "2026-06-30T00:00:00Z");
});


test("hasActiveTradeopsProEntitlement rejects expired entitlements", () => {
  const active = hasActiveTradeopsProEntitlement(
    {
      entitlementKey: "tradeops_pro",
      status: "active",
      expiresAt: "2026-06-30T00:00:00Z",
    },
    new Date("2026-06-20T10:00:00Z"),
  );
  const expired = hasActiveTradeopsProEntitlement(
    {
      entitlementKey: "tradeops_pro",
      status: "active",
      expiresAt: "2026-06-01T00:00:00Z",
    },
    new Date("2026-06-20T10:00:00Z"),
  );

  assert.equal(active, true);
  assert.equal(expired, false);
});
