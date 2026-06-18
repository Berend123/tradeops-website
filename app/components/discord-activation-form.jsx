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
      message: body.already_active ? "Pro access is already active on your Discord account." : "Pro access is now active on your Discord account.",
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
  checkoutConfirmed = false,
  connectedDiscordUserId = "",
  connectedDiscordLabel = "",
  connectedEmail = "",
  connectHref = "/api/discord/oauth/start?return_to=%2Fjoin",
}) {
  const [email, setEmail] = useState(connectedEmail);
  const [discordUserId, setDiscordUserId] = useState(connectedDiscordUserId);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);

  return (
    <div className="activation-panel">
      <div className="section-heading">
        <span className="eyebrow">{checkoutConfirmed ? "Activate Pro" : "Already Paid?"}</span>
        <h2>Unlock Discord Pro access now.</h2>
        <p>
          {connectedDiscordUserId
            ? "Your Discord account is connected. Enter the checkout email tied to your Lemon Squeezy subscription and the site will grant the premium role immediately."
            : "Connect Discord first for the clean path. If you already paid, you can still enter the checkout email and Discord user ID manually to grant the premium role immediately."}
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
                discord_user_id: discordUserId,
              }),
            });
            const body = await response.json().catch(() => ({}));
            setStatus(buildStatus(body));
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

        {connectedDiscordUserId ? null : (
          <label className="field-shell">
            <span className="field-label">Discord user ID</span>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              placeholder="1515448552623702106"
              value={discordUserId}
              onChange={(event) => setDiscordUserId(event.target.value)}
              required
            />
            <span className="field-help">
              Use the numeric Discord ID. A pasted profile link or mention also works if it contains the ID.
            </span>
          </label>
        )}

        <div className="subpage-actions activation-actions">
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? "Activating..." : "Activate Pro Access"}
          </button>
        </div>

        {status.message ? (
          <p className={`capture-status${status.tone === "error" ? " capture-status-error" : ""}`}>
            {status.message}
            {status.details ? ` ${status.details}` : ""}
          </p>
        ) : null}
      </form>
    </div>
  );
}
