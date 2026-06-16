"use client";

import { useState } from "react";
import { useAttribution } from "./attribution-page";


export default function EmailCaptureForm({ formName = "launch_waitlist" }) {
  const { emitEvent, state } = useAttribution();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="capture-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("");
        setError("");
        try {
          const response = await emitEvent("email_capture_submitted", {
            email,
            page: window.location.pathname,
            metadata: {
              form_name: formName,
            },
          });
          if (!response.ok) {
            throw new Error(response.error || "Email capture failed.");
          }
          setStatus("Email capture recorded for the TradeOps launch funnel.");
          setEmail("");
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Email capture failed.");
        }
      }}
    >
      <label className="field-label" htmlFor={`${formName}-email`}>
        Email for launch updates
      </label>
      <div className="capture-row">
        <input
          id={`${formName}-email`}
          className="field-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <button className="button button-secondary" type="submit">
          Save Email
        </button>
      </div>
      <input type="hidden" name="atid" value={state?.currentAtid || ""} readOnly />
      <input type="hidden" name="first_touch_atid" value={state?.firstTouchAtid || ""} readOnly />
      <input type="hidden" name="last_touch_atid" value={state?.lastTouchAtid || ""} readOnly />
      {status ? <p className="capture-status">{status}</p> : null}
      {error ? <p className="capture-status capture-status-error">{error}</p> : null}
    </form>
  );
}
