"use client";

import { useState } from "react";


const DEFAULT_STATUS = {
  tone: "",
  message: "",
  details: "",
};


function buildStatus(body) {
  if (!body || typeof body !== "object") {
    return {
      tone: "error",
      message: "Discord activation failed.",
      details: "",
    };
  }

  if (body.ok) {
    return {
      tone: "success",
      message: body.already_active ? "TradeOps Pro was already active on this Discord account." : "TradeOps Pro is now claimed on this Discord account.",
      details:
        body.premium_role?.name
          ? `Role: ${body.premium_role.name}${body.subscription?.status ? ` | Subscription: ${body.subscription.status}` : ""}`
          : body.subscription?.status
            ? `Subscription: ${body.subscription.status}`
            : "",
    };
  }

  return {
    tone: "error",
    message: body.error || "Discord activation failed.",
    details: "",
  };
}


export default function DiscordActivationForm({
  id = "",
  checkoutConfirmed = false,
  connectedDiscordUserId = "",
  connectedDiscordLabel = "",
  connectHref = "/api/discord/oauth/start?return_to=%2Fjoin",
  redirectTo = "/dashboard",
  hasActivePro = false,
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);

  return (
    <div className="activation-panel" id={id || undefined}>
      <div className="section-heading">
        <span className="eyebrow">{checkoutConfirmed ? "Claim Pro Access" : "Already Paid?"}</span>
        <h2>Claim website and Discord Pro access.</h2>
        <p>
          {hasActivePro
            ? "Your TradeOps Pro access is already active. You can open the dashboard or Discord directly."
            : connectedDiscordUserId
              ? "Your Discord account is connected. Enter the checkout email tied to your Lemon Squeezy subscription and the site will claim both dashboard and Discord Pro access."
              : "Connect Discord first. The claim form becomes available after the OAuth step completes."}
        </p>
      </div>

      {connectedDiscordUserId ? (
        <div className="join-status-pill join-status-pill-confirmed">
          Connected Discord account: {connectedDiscordLabel || connectedDiscordUserId}
        </div>
      ) : (
        <div className="subpage-actions activation-actions">
          <a className="button button-secondary" href={connectHref}>
            Connect Discord
          </a>
        </div>
      )}

      {hasActivePro ? (
        <div className="subpage-actions activation-actions">
          <a className="button button-primary" href={redirectTo}>
            Open dashboard
          </a>
        </div>
      ) : null}

      {!connectedDiscordUserId || hasActivePro ? null : (
      <form
        className="capture-form activation-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setStatus(DEFAULT_STATUS);

          try {
            const response = await fetch("/api/discord/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                redirect_to: redirectTo,
              }),
            });
            const body = await response.json().catch(() => ({}));
            const nextStatus = buildStatus(body);
            setStatus(nextStatus);
            if (response.ok && body?.ok && body?.redirect_to) {
              window.location.href = body.redirect_to;
            }
          } catch (error) {
            setStatus({
              tone: "error",
              message: error instanceof Error ? error.message : "Discord activation failed.",
              details: "",
            });
          } finally {
            setBusy(false);
          }
        }}
        >
        <label className="field-shell">
          <span className="field-label">Checkout email</span>
          <input
            className="field-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <div className="subpage-actions activation-actions">
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? "Claiming..." : "Claim Pro Access"}
          </button>
        </div>

        {status.message ? (
          <p className={`capture-status${status.tone === "error" ? " capture-status-error" : ""}`}>
            {status.message}
            {status.details ? ` ${status.details}` : ""}
          </p>
        ) : null}
      </form>
      )}
    </div>
  );
}
