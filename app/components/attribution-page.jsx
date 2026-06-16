"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSynchronizedUrl,
  buildTrackedHref,
  buildWebsiteEventPayload,
  getPageViewEventType,
  initializeAttributionState,
  readStoredAttribution,
  writeStoredAttribution,
} from "../../lib/attribution-state.mjs";


const AttributionContext = createContext({
  state: null,
  emitEvent: async () => ({ ok: false }),
  buildHref: (href) => href,
  startCheckout: async () => null,
});


async function postJson(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }
  return body;
}


export function AttributionPage({ pageType = "landing", pageViewMetadata = {}, children }) {
  const [state, setState] = useState(null);
  const pageViewSentRef = useRef(false);
  const attributionEndpoint = process.env.NEXT_PUBLIC_ATTRIBUTION_ENDPOINT || "/api/attribution/event";
  const checkoutEndpoint = process.env.NEXT_PUBLIC_CHECKOUT_ENDPOINT || "/api/checkout/session";

  useEffect(() => {
    const localState = readStoredAttribution(window.localStorage);
    const sessionState = readStoredAttribution(window.sessionStorage);
    const nextState = initializeAttributionState({
      search: window.location.search,
      pathname: window.location.pathname,
      referrer: document.referrer,
      localState,
      sessionState,
    });
    writeStoredAttribution(window.localStorage, window.sessionStorage, nextState);
    if (!window.location.search.includes("atid=") && nextState.currentAtid) {
      const synchronized = buildSynchronizedUrl(window.location.href, nextState);
      window.history.replaceState({}, "", synchronized);
    }
    setState(nextState);
  }, []);

  const emitEvent = async (eventType, options = {}) => {
    if (!state) {
      return { ok: false, skipped: true };
    }
    const payload = buildWebsiteEventPayload({
      eventType,
      state,
      page: options.page || window.location.pathname,
      referrer: options.referrer || document.referrer,
      metadata: options.metadata || {},
      email: options.email || "",
      discordUserId: options.discordUserId || "",
      checkoutSessionId: options.checkoutSessionId || "",
      planId: options.planId || "",
      planName: options.planName || "",
      source: options.source || "",
      campaign: options.campaign || "",
    });
    try {
      return await postJson(attributionEndpoint, payload);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unknown attribution error." };
    }
  };

  const startCheckout = async ({
    planId = "tradeops_pro",
    planName = "TradeOps Pro",
    amount = 29,
    billingInterval = "monthly",
    email = "",
    metadata = {},
  } = {}) => {
    if (!state) {
      throw new Error("Attribution state is not ready.");
    }
    const response = await postJson(checkoutEndpoint, {
      atid: state.currentAtid,
      first_touch_atid: state.firstTouchAtid,
      last_touch_atid: state.lastTouchAtid,
      anonymous_id: state.anonymousId,
      source: state.lastTouchSource || "website",
      campaign: state.lastTouchCampaign || "",
      plan_id: planId,
      plan_name: planName,
      amount,
      billing_interval: billingInterval,
      email,
      metadata,
    });
    return response.session;
  };

  useEffect(() => {
    if (!state || pageViewSentRef.current) {
      return;
    }
    pageViewSentRef.current = true;
    const eventType = getPageViewEventType(pageType);
    void emitEvent(eventType, {
      page: window.location.pathname,
      metadata: { page_type: pageType, ...pageViewMetadata },
    });
  }, [pageType, pageViewMetadata, state]);

  const value = useMemo(
    () => ({
      state,
      emitEvent,
      buildHref: (href) => buildTrackedHref(href, state),
      startCheckout,
    }),
    [state],
  );

  return <AttributionContext.Provider value={value}>{children}</AttributionContext.Provider>;
}


export function useAttribution() {
  return useContext(AttributionContext);
}
