"use client";

import { useEffect, useState } from "react";


function parseOAuthFragment(hash) {
  const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  return {
    accessToken: params.get("access_token") || "",
    state: params.get("state") || "",
    tokenType: params.get("token_type") || "",
    scope: params.get("scope") || "",
    expiresIn: params.get("expires_in") || "",
    error: params.get("error") || "",
    errorDescription: params.get("error_description") || "",
  };
}


export default function DiscordOAuthComplete() {
  const [status, setStatus] = useState("Finalizing Discord connection...");
  const [error, setError] = useState("");

  useEffect(() => {
    const fragment = parseOAuthFragment(window.location.hash);
    if (fragment.error) {
      setStatus("");
      setError(fragment.errorDescription || fragment.error);
      return;
    }
    if (!fragment.accessToken || !fragment.state) {
      setStatus("");
      setError("Discord did not return an OAuth access token.");
      return;
    }

    const finalize = async () => {
      try {
        const response = await fetch("/api/discord/oauth/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: fragment.accessToken,
            state: fragment.state,
            token_type: fragment.tokenType,
            scope: fragment.scope,
            expires_in: fragment.expiresIn,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.ok || !body?.redirect_to) {
          throw new Error(body?.error || `Discord finalize failed with status ${response.status}.`);
        }
        window.location.assign(body.redirect_to);
      } catch (finalizeError) {
        setStatus("");
        setError(finalizeError instanceof Error ? finalizeError.message : "Discord finalize failed.");
      }
    };

    void finalize();
  }, []);

  return (
    <main className="page-shell subpage-shell">
      <section className="subpage-hero">
        <div className="section-heading">
          <span className="eyebrow">Discord OAuth</span>
          <h1>Connecting your Discord account.</h1>
          <p>{status || "The OAuth handoff could not be completed."}</p>
          {error ? <p className="capture-status capture-status-error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
