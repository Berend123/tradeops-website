import crypto from "node:crypto";


const DEFAULT_API_BASE_URL = "https://api.lemonsqueezy.com/v1";


function clean(value) {
  return String(value || "").trim();
}


function normalizedKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}


function normalizeDiscordUserId(value) {
  const match = clean(value).match(/(\d{17,20})/);
  return match ? match[1] : "";
}


function normalizedInterval(value) {
  const normalized = normalizedKey(value);
  const aliases = {
    annual: "year",
    annually: "year",
    daily: "day",
    day: "day",
    monthly: "month",
    month: "month",
    quarter: "quarter",
    quarterly: "quarter",
    weekly: "week",
    week: "week",
    year: "year",
    yearly: "year",
  };
  return aliases[normalized] || normalized;
}


function parseBoolean(value, defaultValue = false) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) {
    return defaultValue;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}


function parseAmount(value, defaultValue = 29) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : defaultValue;
}


function hashEmail(email) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) {
    return "";
  }
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}


function compactStringRecord(record) {
  const compacted = {};
  for (const [key, value] of Object.entries(record || {})) {
    const cleaned = clean(value);
    if (cleaned) {
      compacted[key] = cleaned;
    }
  }
  return compacted;
}


function appendQueryParam(url, key, value, origin = "https://tradeops.org") {
  const normalizedUrl = clean(url);
  const normalizedKey = clean(key);
  const normalizedValue = clean(value);
  if (!normalizedUrl || !normalizedKey || !normalizedValue) {
    return normalizedUrl;
  }
  try {
    const resolved = new URL(normalizedUrl, origin);
    if (!resolved.searchParams.get(normalizedKey)) {
      resolved.searchParams.set(normalizedKey, normalizedValue);
    }
    return resolved.toString();
  } catch {
    return normalizedUrl;
  }
}


function getLemonConfig(env = process.env) {
  return {
    apiBaseUrl: clean(env.LEMON_SQUEEZY_API_BASE_URL) || DEFAULT_API_BASE_URL,
    apiKey: clean(env.LEMON_SQUEEZY_API_KEY),
    storeId: clean(env.LEMON_SQUEEZY_STORE_ID),
    productId: clean(env.LEMON_SQUEEZY_PRODUCT_ID),
    variantId: clean(env.LEMON_SQUEEZY_VARIANT_ID),
    webhookSecret: clean(env.LEMON_SQUEEZY_WEBHOOK_SECRET),
    testMode: parseBoolean(env.LEMON_SQUEEZY_TEST_MODE, false),
    receiptButtonText: clean(env.LEMON_SQUEEZY_RECEIPT_BUTTON_TEXT) || "Open TradeOps",
    receiptLinkUrl: clean(env.LEMON_SQUEEZY_RECEIPT_LINK_URL) || "https://tradeops.org/join",
    receiptThankYouNote: clean(env.LEMON_SQUEEZY_RECEIPT_THANK_YOU_NOTE) || "TradeOps attribution is active for this checkout.",
    successUrl: clean(env.LEMON_SQUEEZY_SUCCESS_URL),
    cancelUrl: clean(env.LEMON_SQUEEZY_CANCEL_URL),
  };
}


async function parseLemonResponse(response) {
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const details = raw || `Request failed with status ${response.status}.`;
    throw new Error(`Lemon Squeezy request failed (${response.status}): ${details}`);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Lemon Squeezy returned an invalid JSON object.");
  }
  return payload;
}


async function lemonRequest({ apiKey, url, method = "GET", body = null }) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...(body ? { "Content-Type": "application/vnd.api+json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return parseLemonResponse(response);
}


async function retrieveResource({ apiKey, apiBaseUrl, resource, id }) {
  const normalizedId = clean(id);
  if (!normalizedId) {
    throw new Error(`A ${resource} id is required.`);
  }
  const url = `${apiBaseUrl.replace(/\/+$/, "")}/${resource.replace(/^\/+/, "")}/${normalizedId}`;
  const payload = await lemonRequest({ apiKey, url });
  if (!payload?.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    throw new Error(`Lemon Squeezy did not return a valid ${resource} object for id '${normalizedId}'.`);
  }
  return payload.data;
}


async function listResources({ apiKey, apiBaseUrl, resource, query = null }) {
  const rows = [];
  const visited = new Set();
  let url = `${apiBaseUrl.replace(/\/+$/, "")}/${resource.replace(/^\/+/, "")}`;
  if (query && typeof query === "object") {
    const params = new URLSearchParams(query);
    if (String(params)) {
      url = `${url}?${params.toString()}`;
    }
  }

  while (url && !visited.has(url)) {
    visited.add(url);
    const payload = await lemonRequest({ apiKey, url });
    if (Array.isArray(payload.data)) {
      rows.push(...payload.data.filter((row) => row && typeof row === "object"));
    }
    url = typeof payload?.links?.next === "string" ? payload.links.next.trim() : "";
  }

  return rows;
}


function normalizeStore(row) {
  const attributes = row?.attributes && typeof row.attributes === "object" ? row.attributes : {};
  return {
    id: clean(row?.id),
    name: clean(attributes.name),
    slug: clean(attributes.slug),
  };
}


function normalizeProduct(row) {
  const attributes = row?.attributes && typeof row.attributes === "object" ? row.attributes : {};
  return {
    id: clean(row?.id),
    name: clean(attributes.name),
    slug: clean(attributes.slug),
    status: clean(attributes.status),
    testMode: Boolean(attributes.test_mode),
  };
}


function normalizeVariant(row) {
  const attributes = row?.attributes && typeof row.attributes === "object" ? row.attributes : {};
  const rawPrice = attributes.price ?? attributes.custom_price ?? 0;
  const parsedPrice = Number(rawPrice);
  return {
    id: clean(row?.id),
    name: clean(attributes.name),
    status: clean(attributes.status),
    productId: clean(attributes.product_id),
    isSubscription: Boolean(attributes.is_subscription),
    interval: clean(attributes.interval || attributes.billing_interval),
    price: Number.isFinite(parsedPrice) ? parsedPrice / 100 : 0,
    currency: clean(attributes.currency).toUpperCase() || "USD",
    testMode: Boolean(attributes.test_mode),
  };
}


async function assertLiveCatalogSelection({
  apiKey,
  apiBaseUrl,
  productId,
  variantId,
}) {
  const requests = [
    retrieveResource({ apiKey, apiBaseUrl, resource: "variants", id: variantId }),
  ];
  if (clean(productId)) {
    requests.unshift(retrieveResource({ apiKey, apiBaseUrl, resource: "products", id: productId }));
  }
  const responses = await Promise.all(requests);
  const product = clean(productId) ? normalizeProduct(responses[0]) : null;
  const variant = normalizeVariant(responses[responses.length - 1]);
  if (product?.testMode || variant.testMode) {
    throw new Error(
      `Configured Lemon Squeezy catalog points to test-mode objects (${product ? `product ${product.id}, ` : ""}variant ${variant.id}). Use live-mode API keys and live product/variant ids before taking payments.`,
    );
  }
}


function normalizeSubscription(row) {
  const attributes = row?.attributes && typeof row.attributes === "object" ? row.attributes : {};
  const urls = attributes.urls && typeof attributes.urls === "object" ? attributes.urls : {};
  return {
    id: clean(row?.id),
    storeId: clean(attributes.store_id),
    productId: clean(attributes.product_id),
    variantId: clean(attributes.variant_id),
    customerId: clean(attributes.customer_id),
    orderId: clean(attributes.order_id),
    name: clean(attributes.user_name),
    email: clean(attributes.user_email).toLowerCase(),
    status: clean(attributes.status).toLowerCase(),
    cancelled: Boolean(attributes.cancelled),
    endsAt: clean(attributes.ends_at),
    renewsAt: clean(attributes.renews_at),
    createdAt: clean(attributes.created_at),
    updatedAt: clean(attributes.updated_at),
    productName: clean(attributes.product_name),
    variantName: clean(attributes.variant_name),
    customerPortalUrl:
      clean(urls.customer_portal) ||
      clean(urls.update_payment_method) ||
      clean(urls.update_subscription) ||
      "",
  };
}


const ENTITLED_SUBSCRIPTION_STATUSES = new Set(["active", "on_trial", "paused", "past_due"]);


function parseTimestamp(value) {
  const timestamp = Date.parse(clean(value));
  return Number.isFinite(timestamp) ? timestamp : 0;
}


export function isEntitledLemonSubscription(subscription, now = new Date()) {
  const status = clean(subscription?.status).toLowerCase();
  if (ENTITLED_SUBSCRIPTION_STATUSES.has(status)) {
    return true;
  }
  if (status !== "cancelled") {
    return false;
  }

  const endsAt = parseTimestamp(subscription?.endsAt);
  if (!endsAt) {
    return true;
  }
  return endsAt >= now.getTime();
}


function compareSubscriptionPriority(left, right, now = new Date()) {
  const priority = (subscription) => {
    const status = clean(subscription?.status).toLowerCase();
    if (status === "active") {
      return 5;
    }
    if (status === "on_trial") {
      return 4;
    }
    if (status === "past_due") {
      return 3;
    }
    if (status === "paused") {
      return 2;
    }
    if (status === "cancelled" && isEntitledLemonSubscription(subscription, now)) {
      return 1;
    }
    return 0;
  };

  const leftPriority = priority(left);
  const rightPriority = priority(right);
  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }

  const leftUpdated = parseTimestamp(left?.updatedAt) || parseTimestamp(left?.createdAt);
  const rightUpdated = parseTimestamp(right?.updatedAt) || parseTimestamp(right?.createdAt);
  return rightUpdated - leftUpdated;
}


function pickStore(stores, config) {
  if (config.storeId) {
    const matched = stores.find((store) => store.id === config.storeId);
    if (!matched) {
      throw new Error(`Configured Lemon Squeezy store id '${config.storeId}' was not found.`);
    }
    return { store: matched, reason: "matched configured store id" };
  }
  if (stores.length === 1) {
    return { store: stores[0], reason: "selected only available store" };
  }
  const tradeopsMatch = stores.filter((store) => normalizedKey(store.name).includes("tradeops") || normalizedKey(store.slug).includes("tradeops"));
  if (tradeopsMatch.length === 1) {
    return { store: tradeopsMatch[0], reason: "matched TradeOps store name" };
  }
  throw new Error(`Could not determine which Lemon Squeezy store to use. Available stores: ${stores.map((store) => `${store.id} (${store.name})`).join(", ")}`);
}


function pickProduct(products, config, planId, planName) {
  if (config.productId) {
    const matched = products.find((product) => product.id === config.productId);
    if (!matched) {
      throw new Error(`Configured Lemon Squeezy product id '${config.productId}' was not found.`);
    }
    return { product: matched, reason: "matched configured product id" };
  }
  if (products.length === 1) {
    return { product: products[0], reason: "selected only available product" };
  }
  const targets = new Set([normalizedKey(planId), normalizedKey(planName), "tradeopspro"]);
  const matched = products.filter((product) => targets.has(normalizedKey(product.name)) || targets.has(normalizedKey(product.slug)));
  if (matched.length === 1) {
    return { product: matched[0], reason: "matched plan id/name to product" };
  }
  throw new Error(`Could not determine which Lemon Squeezy product to use. Available products: ${products.map((product) => `${product.id} (${product.name})`).join(", ")}`);
}


function pickVariant(variants, config, billingInterval) {
  if (config.variantId) {
    const matched = variants.find((variant) => variant.id === config.variantId);
    if (!matched) {
      throw new Error(`Configured Lemon Squeezy variant id '${config.variantId}' was not found.`);
    }
    return { variant: matched, reason: "matched configured variant id" };
  }

  const intervalTarget = normalizedInterval(billingInterval);
  const intervalMatches = variants.filter((variant) => normalizedInterval(variant.interval) === intervalTarget);
  if (intervalMatches.length === 1) {
    return { variant: intervalMatches[0], reason: "matched billing interval" };
  }

  const activeSubscriptionVariants = (intervalMatches.length > 0 ? intervalMatches : variants).filter(
    (variant) => ["published", "active", ""].includes(variant.status) && variant.isSubscription,
  );
  if (activeSubscriptionVariants.length === 1) {
    return { variant: activeSubscriptionVariants[0], reason: "selected only active subscription variant" };
  }

  if (variants.length === 1) {
    return { variant: variants[0], reason: "selected only available variant" };
  }

  throw new Error(`Could not determine which Lemon Squeezy variant to use. Available variants: ${variants.map((variant) => `${variant.id} (${variant.name})`).join(", ")}`);
}


export async function discoverLemonCatalog({
  env = process.env,
  planId = "tradeops_pro",
  planName = "TradeOps Pro",
  billingInterval = "monthly",
} = {}) {
  const config = getLemonConfig(env);
  if (!config.apiKey) {
    throw new Error("Lemon Squeezy API key is not configured.");
  }

  const stores = (await listResources({ apiKey: config.apiKey, apiBaseUrl: config.apiBaseUrl, resource: "stores" })).map(normalizeStore);
  if (stores.length === 0) {
    throw new Error("No Lemon Squeezy stores were returned for this API key.");
  }
  const { store, reason: storeReason } = pickStore(stores, config);

  const products = (
    await listResources({
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      resource: "products",
      query: { "filter[store_id]": store.id },
    })
  ).map(normalizeProduct);
  if (products.length === 0) {
    throw new Error(`No Lemon Squeezy products were returned for store '${store.id}'.`);
  }
  const { product, reason: productReason } = pickProduct(products, config, planId, planName);

  const variants = (
    await listResources({
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      resource: "variants",
      query: { "filter[product_id]": product.id },
    })
  ).map(normalizeVariant);
  if (variants.length === 0) {
    throw new Error(`No Lemon Squeezy variants were returned for product '${product.id}'.`);
  }
  const { variant, reason: variantReason } = pickVariant(variants, config, billingInterval);

  return {
    storeId: store.id,
    productId: product.id,
    variantId: variant.id,
    selectionReason: [storeReason, productReason, variantReason].filter(Boolean).join(" / "),
  };
}


export async function listLemonSubscriptionsByEmail({
  email,
  env = process.env,
  planId = "tradeops_pro",
  planName = "TradeOps Pro",
  billingInterval = "monthly",
} = {}) {
  const normalizedEmail = clean(email).toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Checkout email is required.");
  }

  const config = getLemonConfig(env);
  if (!config.apiKey) {
    throw new Error("Lemon Squeezy API key is not configured.");
  }

  let storeId = config.storeId;
  let productId = config.productId;
  let variantId = config.variantId;
  if (!storeId || (!productId && !variantId)) {
    const discovered = await discoverLemonCatalog({
      env,
      planId,
      planName,
      billingInterval,
    });
    storeId = storeId || discovered.storeId;
    productId = productId || discovered.productId;
    variantId = variantId || discovered.variantId;
  }

  const query = {
    "filter[user_email]": normalizedEmail,
    ...(storeId ? { "filter[store_id]": storeId } : {}),
  };
  const rows = await listResources({
    apiKey: config.apiKey,
    apiBaseUrl: config.apiBaseUrl,
    resource: "subscriptions",
    query,
  });

  return rows
    .map(normalizeSubscription)
    .filter((subscription) => {
      if (variantId && subscription.variantId && subscription.variantId !== variantId) {
        return false;
      }
      if (!variantId && productId && subscription.productId && subscription.productId !== productId) {
        return false;
      }
      return true;
    });
}


export async function listAllLemonSubscriptions({
  env = process.env,
  planId = "tradeops_pro",
  planName = "TradeOps Pro",
  billingInterval = "monthly",
} = {}) {
  const config = getLemonConfig(env);
  if (!config.apiKey) {
    throw new Error("Lemon Squeezy API key is not configured.");
  }

  let storeId = config.storeId;
  let productId = config.productId;
  let variantId = config.variantId;
  if (!storeId || (!productId && !variantId)) {
    const discovered = await discoverLemonCatalog({
      env,
      planId,
      planName,
      billingInterval,
    });
    storeId = storeId || discovered.storeId;
    productId = productId || discovered.productId;
    variantId = variantId || discovered.variantId;
  }

  const query = {
    ...(storeId ? { "filter[store_id]": storeId } : {}),
  };
  const rows = await listResources({
    apiKey: config.apiKey,
    apiBaseUrl: config.apiBaseUrl,
    resource: "subscriptions",
    query,
  });

  return rows
    .map(normalizeSubscription)
    .filter((subscription) => {
      if (variantId && subscription.variantId && subscription.variantId !== variantId) {
        return false;
      }
      if (!variantId && productId && subscription.productId && subscription.productId !== productId) {
        return false;
      }
      return true;
    });
}


export async function findEntitledLemonSubscription({
  email,
  env = process.env,
  now = new Date(),
  planId = "tradeops_pro",
  planName = "TradeOps Pro",
  billingInterval = "monthly",
} = {}) {
  const subscriptions = await listLemonSubscriptionsByEmail({
    email,
    env,
    planId,
    planName,
    billingInterval,
  });
  const entitled = subscriptions.filter((subscription) => isEntitledLemonSubscription(subscription, now));
  entitled.sort((left, right) => compareSubscriptionPriority(left, right, now));
  return entitled[0] || null;
}


export async function createLemonCheckoutSession({
  payload,
  origin = "https://tradeops.org",
  env = process.env,
} = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload must be a JSON object.");
  }

  const config = getLemonConfig(env);
  if (!config.apiKey) {
    throw new Error("Lemon Squeezy API key is not configured.");
  }

  const planId = clean(payload.plan_id) || "tradeops_pro";
  const planName = clean(payload.plan_name) || "TradeOps Pro";
  const billingInterval = clean(payload.billing_interval) || "monthly";
  const amount = parseAmount(payload.amount, 29);
  const currency = clean(payload.currency).toUpperCase() || "USD";
  const email = clean(payload.email).toLowerCase();
  const name = clean(payload.name);
  const successUrlBase = clean(payload.success_url) || config.successUrl || `${origin.replace(/\/+$/, "")}/join?checkout=success`;
  const cancelUrl = clean(payload.cancel_url) || config.cancelUrl || `${origin.replace(/\/+$/, "")}/pricing?checkout=cancelled`;
  const relationshipId = clean(payload.relationship_id) || crypto.randomUUID();
  const successUrl = appendQueryParam(successUrlBase, "session_id", relationshipId, origin);

  let storeId = config.storeId;
  let productId = config.productId;
  let variantId = config.variantId;
  let selectionReason = "";

  if (!storeId || !variantId) {
    const discovered = await discoverLemonCatalog({
      env,
      planId,
      planName,
      billingInterval,
    });
    storeId = storeId || discovered.storeId;
    productId = productId || discovered.productId;
    variantId = variantId || discovered.variantId;
    selectionReason = discovered.selectionReason;
  }

  if (!storeId) {
    throw new Error("Lemon Squeezy store id could not be resolved.");
  }
  if (!variantId) {
    throw new Error(`Lemon Squeezy variant id could not be resolved for plan '${planId}'.`);
  }
  if (!config.testMode) {
    await assertLiveCatalogSelection({
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      productId,
      variantId,
    });
  }

  const metadata = {
    atid: clean(payload.atid),
    first_touch_atid: clean(payload.first_touch_atid),
    last_touch_atid: clean(payload.last_touch_atid),
    source: clean(payload.source) || "website",
    campaign: clean(payload.campaign) || "website_checkout",
    username: clean(payload.username),
    discord_user_id: normalizeDiscordUserId(payload.discord_user_id),
    relationship_id: relationshipId,
    anonymous_id: clean(payload.anonymous_id),
    email_hash: hashEmail(email),
    plan_id: planId,
    billing_interval: billingInterval,
  };

  const checkoutData = { custom: compactStringRecord(metadata) };
  if (email) {
    checkoutData.email = email;
  }
  if (name) {
    checkoutData.name = name;
  }

  const requestBody = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: checkoutData,
        product_options: {
          redirect_url: successUrl,
          receipt_button_text: config.receiptButtonText,
          receipt_link_url: config.receiptLinkUrl,
          receipt_thank_you_note: config.receiptThankYouNote,
        },
        checkout_options: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
        },
        ...(config.testMode ? { test_mode: true } : {}),
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const endpoint = `${config.apiBaseUrl.replace(/\/+$/, "")}/checkouts`;
  const responsePayload = await lemonRequest({
    apiKey: config.apiKey,
    url: endpoint,
    method: "POST",
    body: requestBody,
  });

  const data = responsePayload?.data && typeof responsePayload.data === "object" ? responsePayload.data : {};
  const attributes = data?.attributes && typeof data.attributes === "object" ? data.attributes : {};
  const checkoutUrl = clean(attributes.url);
  if (!checkoutUrl) {
    throw new Error("Lemon Squeezy checkout response did not include a checkout URL.");
  }

  return {
    session_id: clean(data.id) || crypto.createHash("sha256").update(checkoutUrl, "utf8").digest("hex").slice(0, 16),
    provider: "lemon_squeezy",
    checkout_url: checkoutUrl,
    success_url: successUrl,
    cancel_url: cancelUrl,
    plan_id: planId,
    plan_name: planName,
    billing_interval: billingInterval,
    amount,
    currency,
    metadata: {
      ...metadata,
      store_id: String(storeId),
      product_id: String(productId || ""),
      variant_id: String(variantId),
      provider: "lemon_squeezy",
      catalog_selection_reason: selectionReason,
    },
  };
}


export function verifyLemonWebhookSignature({ rawBody, signature, env = process.env }) {
  const secret = getLemonConfig(env).webhookSecret;
  if (!secret) {
    throw new Error("Lemon Squeezy webhook secret is not configured.");
  }
  if (!clean(signature)) {
    throw new Error("Lemon Squeezy webhook signature is missing.");
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const providedBuffer = Buffer.from(clean(signature), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new Error("Lemon Squeezy webhook signature is invalid.");
  }
}


export function parseLemonWebhook(rawBody) {
  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error("Invalid JSON payload.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("JSON payload must be an object.");
  }
  return payload;
}
