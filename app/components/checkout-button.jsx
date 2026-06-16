"use client";

import { useState } from "react";
import { useAttribution } from "./attribution-page";


export default function CheckoutButton({
  className,
  planId = "tradeops_pro",
  planName = "TradeOps Pro",
  amount = 29,
  billingInterval = "monthly",
  children,
}) {
  const { emitEvent, startCheckout } = useAttribution();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="checkout-button-shell">
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          await emitEvent("checkout_button_click", {
            page: window.location.pathname,
            planId,
            planName,
            metadata: { billing_interval: billingInterval, amount },
          });
          try {
            const session = await startCheckout({
              planId,
              planName,
              amount,
              billingInterval,
              metadata: { website_page: window.location.pathname },
            });
            window.location.assign(session.checkout_url);
          } catch (checkoutError) {
            setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is not configured yet.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparing checkout..." : children}
      </button>
      {error ? <p className="capture-status capture-status-error">{error}</p> : null}
    </div>
  );
}
