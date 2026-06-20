"use client";

import { useState } from "react";


const DEFAULT_STATUS = {
  tone: "",
  message: "",
  previewUrl: "",
};


export default function MemberLoginForm({ redirectTo = "/dashboard" }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);

  return (
    <form
      className="capture-form member-auth-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setStatus(DEFAULT_STATUS);

        try {
          const response = await fetch("/api/auth/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              redirect_to: redirectTo,
            }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body?.ok) {
            setStatus({
              tone: "error",
              message: body?.error || "Could not send the login link.",
              previewUrl: "",
            });
            return;
          }
          setStatus({
            tone: "success",
            message: body.preview_mode
              ? "Preview login link generated locally."
              : "Check your email for the TradeOps login link.",
            previewUrl: body.magic_link_url || "",
          });
        } catch (error) {
          setStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Could not send the login link.",
            previewUrl: "",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field-shell">
        <span className="field-label">Email address</span>
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
          {busy ? "Sending..." : "Send login link"}
        </button>
      </div>

      {status.message ? (
        <div className={`member-auth-status${status.tone === "error" ? " member-auth-status-error" : ""}`}>
          <p>{status.message}</p>
          {status.previewUrl ? (
            <p>
              Preview link:{" "}
              <a href={status.previewUrl} className="inline-link">
                Open dashboard sign-in
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
