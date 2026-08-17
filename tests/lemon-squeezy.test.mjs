import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  createLemonCheckoutSession,
  discoverLemonCatalog,
  findEntitledLemonSubscription,
  isEntitledLemonSubscription,
  parseLemonWebhook,
  verifyLemonWebhookSignature,
} from "../lib/lemon-squeezy.js";


test("createLemonCheckoutSession builds a live Lemon Squeezy checkout without test mode", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, init = {}) => {
    if (url === "https://api.lemonsqueezy.com/v1/products/1149930") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1149930",
            attributes: {
              name: "TradeOps Pro",
              slug: "tradeops-pro",
              status: "published",
              test_mode: false,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://api.lemonsqueezy.com/v1/variants/1799365") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1799365",
            attributes: {
              name: "Default",
              status: "pending",
              product_id: "1149930",
              is_subscription: true,
              interval: "month",
              price: 2900,
              currency: "USD",
              test_mode: false,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    assert.equal(url, "https://api.lemonsqueezy.com/v1/checkouts");
    const body = JSON.parse(init.body);
    assert.equal(body.data.relationships.store.data.id, "409011");
    assert.equal(body.data.relationships.variant.data.id, "1799365");
    assert.equal(body.data.attributes.test_mode, undefined);
    assert.equal(body.data.attributes.checkout_data.custom.plan_id, "tradeops_pro");
    assert.equal(body.data.attributes.checkout_data.custom.discord_user_id, "1515448552623702106");
    assert.equal(body.data.attributes.product_options.redirect_url, "https://tradeops.org/join?checkout=success&session_id=u-1");
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
      discord_user_id: "1515448552623702106",
      relationship_id: "u-1",
      affiliate_tracking_id: "affiliate-tracking-123",
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
  assert.equal(
    session.checkout_url,
    "https://tradeopshq.lemonsqueezy.com/checkout/custom/checkout_live?aff_ref=affiliate-tracking-123",
  );
  assert.equal(session.metadata.store_id, "409011");
  assert.equal(session.metadata.variant_id, "1799365");
  assert.equal(session.metadata.discord_user_id, "1515448552623702106");
  assert.equal(session.metadata.relationship_id, "u-1");
  assert.equal(session.success_url, "https://tradeops.org/join?checkout=success&session_id=u-1");
});


test("createLemonCheckoutSession generates a relationship reference when one is missing", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, init = {}) => {
    if (url === "https://api.lemonsqueezy.com/v1/products/1149930") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1149930",
            attributes: {
              name: "TradeOps Pro",
              slug: "tradeops-pro",
              status: "published",
              test_mode: false,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://api.lemonsqueezy.com/v1/variants/1799365") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1799365",
            attributes: {
              name: "Default",
              status: "pending",
              product_id: "1149930",
              is_subscription: true,
              interval: "month",
              price: 2900,
              currency: "USD",
              test_mode: false,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    assert.equal(url, "https://api.lemonsqueezy.com/v1/checkouts");
    const body = JSON.parse(init.body);
    const custom = body.data.attributes.checkout_data.custom;
    assert.equal(custom.plan_id, "tradeops_pro");
    assert.equal(custom.email_hash, undefined);
    assert.match(custom.relationship_id, /^[0-9a-f-]{32,36}$/i);
    assert.match(body.data.attributes.product_options.redirect_url, /^https:\/\/tradeops\.org\/join\?checkout=success&session_id=[0-9a-f-]{32,36}$/i);
    return new Response(
      JSON.stringify({
        data: {
          id: "checkout_live_blank_identity",
          attributes: {
            url: "https://tradeopshq.lemonsqueezy.com/checkout/custom/checkout_live_blank_identity",
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const session = await createLemonCheckoutSession({
    payload: {
      plan_id: "tradeops_pro",
      plan_name: "TradeOps Pro",
      amount: 29,
      billing_interval: "monthly",
      source: "website",
      campaign: "website_checkout",
      username: "alpha",
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
  assert.equal(session.checkout_url, "https://tradeopshq.lemonsqueezy.com/checkout/custom/checkout_live_blank_identity");
  assert.match(session.metadata.relationship_id, /^[0-9a-f-]{32,36}$/i);
  assert.match(session.success_url, /^https:\/\/tradeops\.org\/join\?checkout=success&session_id=[0-9a-f-]{32,36}$/i);
});


test("createLemonCheckoutSession rejects test-mode catalog objects when test mode is disabled", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url === "https://api.lemonsqueezy.com/v1/products/1149930") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1149930",
            attributes: {
              name: "TradeOps Pro",
              status: "published",
              test_mode: true,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://api.lemonsqueezy.com/v1/variants/1799365") {
      return new Response(
        JSON.stringify({
          data: {
            id: "1799365",
            attributes: {
              name: "Default",
              status: "pending",
              product_id: "1149930",
              is_subscription: true,
              interval: "month",
              price: 2900,
              currency: "USD",
              test_mode: true,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    throw new Error(`Unexpected Lemon Squeezy request: ${url}`);
  };

  await assert.rejects(
    () =>
      createLemonCheckoutSession({
        payload: {
          plan_id: "tradeops_pro",
          plan_name: "TradeOps Pro",
          amount: 29,
          billing_interval: "monthly",
        },
        origin: "https://tradeops.org",
        env: {
          LEMON_SQUEEZY_API_KEY: "ls_key",
          LEMON_SQUEEZY_STORE_ID: "409011",
          LEMON_SQUEEZY_PRODUCT_ID: "1149930",
          LEMON_SQUEEZY_VARIANT_ID: "1799365",
          LEMON_SQUEEZY_TEST_MODE: "false",
        },
      }),
    /test-mode objects/i,
  );
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


test("isEntitledLemonSubscription keeps cancelled subscriptions active until the end date", () => {
  assert.equal(
    isEntitledLemonSubscription(
      {
        status: "cancelled",
        endsAt: "2099-12-31T00:00:00Z",
      },
      new Date("2026-06-18T00:00:00Z"),
    ),
    true,
  );
  assert.equal(
    isEntitledLemonSubscription(
      {
        status: "cancelled",
        endsAt: "2025-01-01T00:00:00Z",
      },
      new Date("2026-06-18T00:00:00Z"),
    ),
    false,
  );
});


test("findEntitledLemonSubscription picks the strongest active subscription for the checkout email", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url.includes("/subscriptions?")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "sub_cancelled",
              attributes: {
                store_id: "409011",
                product_id: "1149930",
                variant_id: "1799365",
                user_email: "alpha@example.com",
                status: "cancelled",
                ends_at: "2099-01-01T00:00:00Z",
                updated_at: "2026-06-17T00:00:00Z",
              },
            },
            {
              id: "sub_active",
              attributes: {
                store_id: "409011",
                product_id: "1149930",
                variant_id: "1799365",
                user_email: "alpha@example.com",
                status: "active",
                updated_at: "2026-06-18T00:00:00Z",
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

  const subscription = await findEntitledLemonSubscription({
    email: "alpha@example.com",
    env: {
      LEMON_SQUEEZY_API_KEY: "ls_key",
      LEMON_SQUEEZY_STORE_ID: "409011",
      LEMON_SQUEEZY_PRODUCT_ID: "1149930",
      LEMON_SQUEEZY_VARIANT_ID: "1799365",
    },
    now: new Date("2026-06-18T00:00:00Z"),
  });

  assert.equal(subscription.id, "sub_active");
  assert.equal(subscription.status, "active");
});
