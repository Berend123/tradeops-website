import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  createLemonCheckoutSession,
  discoverLemonCatalog,
  parseLemonWebhook,
  verifyLemonWebhookSignature,
} from "../lib/lemon-squeezy.js";


test("createLemonCheckoutSession builds a live Lemon Squeezy checkout without test mode", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, init = {}) => {
    assert.equal(url, "https://api.lemonsqueezy.com/v1/checkouts");
    const body = JSON.parse(init.body);
    assert.equal(body.data.relationships.store.data.id, "409011");
    assert.equal(body.data.relationships.variant.data.id, "1799365");
    assert.equal(body.data.attributes.test_mode, undefined);
    assert.equal(body.data.attributes.checkout_data.custom.plan_id, "tradeops_pro");
    assert.equal(body.data.attributes.product_options.redirect_url, "https://tradeops.org/join?checkout=success");
    return new Response(
      JSON.stringify({
        data: {
          id: "checkout_live",
          attributes: {
            url: "https://tradeopshq.lemonsqueezy.com/checkout/custom/checkout_live",
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const session = await createLemonCheckoutSession({
    payload: {
      atid: "abc123",
      first_touch_atid: "abc123",
      last_touch_atid: "abc123",
      anonymous_id: "anon-1",
      source: "x",
      campaign: "reply_queue",
      plan_id: "tradeops_pro",
      plan_name: "TradeOps Pro",
      amount: 29,
      billing_interval: "monthly",
      email: "alpha@example.com",
      username: "alpha",
      relationship_id: "u-1",
    },
    origin: "https://tradeops.org",
    env: {
      LEMON_SQUEEZY_API_KEY: "ls_key",
      LEMON_SQUEEZY_STORE_ID: "409011",
      LEMON_SQUEEZY_PRODUCT_ID: "1149930",
      LEMON_SQUEEZY_VARIANT_ID: "1799365",
      LEMON_SQUEEZY_TEST_MODE: "false",
    },
  });

  assert.equal(session.provider, "lemon_squeezy");
  assert.equal(session.checkout_url, "https://tradeopshq.lemonsqueezy.com/checkout/custom/checkout_live");
  assert.equal(session.metadata.store_id, "409011");
  assert.equal(session.metadata.variant_id, "1799365");
});


test("discoverLemonCatalog matches a monthly plan to a month interval variant", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url === "https://api.lemonsqueezy.com/v1/stores") {
      return new Response(JSON.stringify({ data: [{ id: "store_1", attributes: { name: "TradeOps", slug: "tradeops" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("products?filter%5Bstore_id%5D=store_1")) {
      return new Response(JSON.stringify({ data: [{ id: "prod_1", attributes: { name: "TradeOps Pro", slug: "tradeops-pro" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("variants?filter%5Bproduct_id%5D=prod_1")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "var_month",
              attributes: {
                name: "Monthly",
                status: "published",
                product_id: "prod_1",
                is_subscription: true,
                interval: "month",
                price: 2900,
                currency: "USD",
              },
            },
            {
              id: "var_year",
              attributes: {
                name: "Yearly",
                status: "published",
                product_id: "prod_1",
                is_subscription: true,
                interval: "year",
                price: 29000,
                currency: "USD",
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    throw new Error(`Unexpected Lemon Squeezy request: ${url}`);
  };

  const catalog = await discoverLemonCatalog({
    env: {
      LEMON_SQUEEZY_API_KEY: "ls_key",
    },
    planId: "tradeops_pro",
    planName: "TradeOps Pro",
    billingInterval: "monthly",
  });

  assert.equal(catalog.storeId, "store_1");
  assert.equal(catalog.productId, "prod_1");
  assert.equal(catalog.variantId, "var_month");
});


test("verifyLemonWebhookSignature accepts a valid Lemon webhook payload", () => {
  const rawBody = JSON.stringify({
    meta: { event_name: "subscription_payment_success" },
    data: { type: "subscription-invoices", id: "invoice_123" },
  });
  const secret = "supersecret";
  const signature = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  verifyLemonWebhookSignature({
    rawBody,
    signature,
    env: { LEMON_SQUEEZY_WEBHOOK_SECRET: secret },
  });

  const payload = parseLemonWebhook(rawBody);
  assert.equal(payload.meta.event_name, "subscription_payment_success");
  assert.equal(payload.data.id, "invoice_123");
});
