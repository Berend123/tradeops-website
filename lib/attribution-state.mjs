export const ATTRIBUTION_STORAGE_KEY = "tradeops_attribution_state";

function parseStoredValue(rawValue) {
  if (!rawValue) {
    return {};
  }
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function randomHex(length = 16) {
  const size = Math.max(8, Number(length) || 16);
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(size / 2));
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, size);
  }
  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`.slice(0, size);
}

export function createAnonymousId() {
  return `anon_${randomHex(18)}`;
}

export function readStoredAttribution(storage) {
  if (!storage || typeof storage.getItem !== "function") {
    return {};
  }
  return parseStoredValue(storage.getItem(ATTRIBUTION_STORAGE_KEY));
}

export function writeStoredAttribution(localStorage, sessionStorage, state) {
  const serialized = JSON.stringify(state);
  if (localStorage && typeof localStorage.setItem === "function") {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
  }
  if (sessionStorage && typeof sessionStorage.setItem === "function") {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
  }
}

export function parseAttributionSearch(search) {
  const params = new URLSearchParams((search || "").replace(/^\?/, ""));
  return {
    atid: params.get("atid") || "",
    firstTouchAtid: params.get("first_touch_atid") || params.get("ftid") || "",
    lastTouchAtid: params.get("last_touch_atid") || params.get("ltid") || "",
    source: params.get("src") || params.get("source") || "",
    campaign: params.get("campaign") || "",
    contentType: params.get("content_type") || "",
    affiliateCode: params.get("aff") || "",
  };
}

export function initializeAttributionState({
  search = "",
  pathname = "/",
  referrer = "",
  localState = {},
  sessionState = {},
  nowIso = new Date().toISOString(),
  anonymousId = "",
} = {}) {
  const incoming = parseAttributionSearch(search);
  const existing = Object.keys(localState || {}).length ? localState : sessionState || {};
  const firstTouchAtid = existing.firstTouchAtid || incoming.atid || incoming.firstTouchAtid || "";
  const lastTouchAtid = incoming.atid || incoming.lastTouchAtid || existing.lastTouchAtid || firstTouchAtid;
  const currentAtid = incoming.atid || lastTouchAtid || firstTouchAtid;
  return {
    currentAtid,
    firstTouchAtid,
    lastTouchAtid,
    firstTouchSource: existing.firstTouchSource || incoming.source || "",
    lastTouchSource: incoming.source || existing.lastTouchSource || existing.firstTouchSource || "",
    firstTouchCampaign: existing.firstTouchCampaign || incoming.campaign || "",
    lastTouchCampaign: incoming.campaign || existing.lastTouchCampaign || existing.firstTouchCampaign || "",
    firstTouchContentType: existing.firstTouchContentType || incoming.contentType || "",
    lastTouchContentType: incoming.contentType || existing.lastTouchContentType || existing.firstTouchContentType || "",
    affiliateCode: incoming.affiliateCode || existing.affiliateCode || "",
    anonymousId: existing.anonymousId || anonymousId || createAnonymousId(),
    firstSeenAt: existing.firstSeenAt || nowIso,
    lastSeenAt: nowIso,
    currentPath: pathname || existing.currentPath || "/",
    referrer: referrer || existing.referrer || "",
  };
}

export function buildTrackedHref(baseHref, state) {
  if (!baseHref || !state) {
    return baseHref;
  }
  const origin = "https://tradeops.org";
  const url = new URL(baseHref, origin);
  if (state.currentAtid) {
    url.searchParams.set("atid", state.currentAtid);
  }
  if (state.firstTouchAtid) {
    url.searchParams.set("first_touch_atid", state.firstTouchAtid);
  }
  if (state.lastTouchAtid) {
    url.searchParams.set("last_touch_atid", state.lastTouchAtid);
  }
  if (state.lastTouchSource) {
    url.searchParams.set("src", state.lastTouchSource);
  }
  if (state.lastTouchCampaign) {
    url.searchParams.set("campaign", state.lastTouchCampaign);
  }
  if (state.lastTouchContentType) {
    url.searchParams.set("content_type", state.lastTouchContentType);
  }
  const isAbsolute = /^https?:\/\//i.test(baseHref);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function buildSynchronizedUrl(currentHref, state) {
  return buildTrackedHref(currentHref, state);
}

export function getPageViewEventType(pageType = "landing") {
  const normalized = String(pageType || "landing").trim().toLowerCase();
  if (normalized === "pricing") {
    return "pricing_page_view";
  }
  if (normalized === "join") {
    return "join_page_view";
  }
  if (normalized === "home" || normalized === "landing") {
    return "landing_page_view";
  }
  return `${normalized}_page_view`;
}

export function buildWebsiteEventPayload({
  eventType,
  state,
  page = "/",
  referrer = "",
  metadata = {},
  email = "",
  discordUserId = "",
  checkoutSessionId = "",
  planId = "",
  planName = "",
  source = "",
  campaign = "",
}) {
  const timestamp = new Date().toISOString();
  return {
    event_id: `${eventType}_${randomHex(10)}_${Date.now().toString(16)}`,
    event_type: eventType,
    atid: state?.currentAtid || state?.lastTouchAtid || state?.firstTouchAtid || "",
    first_touch_atid: state?.firstTouchAtid || "",
    last_touch_atid: state?.lastTouchAtid || "",
    anonymous_id: state?.anonymousId || "",
    source: source || state?.lastTouchSource || "website",
    campaign: campaign || state?.lastTouchCampaign || "",
    page,
    referrer,
    timestamp,
    email,
    discord_user_id: discordUserId,
    checkout_session_id: checkoutSessionId,
    plan_id: planId,
    plan_name: planName,
    metadata,
    affiliate_code: state?.affiliateCode || "",
  };
}
