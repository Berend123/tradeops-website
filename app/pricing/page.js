import { cookies } from "next/headers";

import { AttributionPage } from "../components/attribution-page";
import CheckoutButton from "../components/checkout-button";
import EmailCaptureForm from "../components/email-capture-form";
import TrackedActionLink from "../components/tracked-action-link";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../lib/discord-oauth";


export const metadata = {
  title: "TradeOps | Pricing",
  description: "TradeOps pricing and checkout handoff with preserved attribution metadata.",
};


function buildDiscordConnectHref() {
  return "/api/discord/oauth/start?return_to=%2Fpricing";
}


export default async function PricingPage() {
  const cookieStore = await cookies();
  const discordSession = parseDiscordSession(cookieStore.get(DISCORD_SESSION_COOKIE)?.value || "");
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";
  const connectHref = buildDiscordConnectHref();
  const connectedDiscordLabel = discordSession?.globalName || discordSession?.username || discordSession?.userId || "";
  return (
    <AttributionPage pageType="pricing">
      <main className="page-shell subpage-shell">
        <section className="subpage-hero">
          <div className="section-heading">
            <span className="eyebrow">Pricing</span>
            <h1>TradeOps Pro is $29 per month.</h1>
            <p>
              The checkout handoff carries `atid`, first-touch, last-touch, source, campaign, and
              relationship identifiers so paid conversions can be tied back to X campaigns and users.
            </p>
          </div>

          <div className="pricing-grid pricing-grid-single">
            <article className="pricing-card pricing-card-primary">
              <div className="pricing-card-head">
                <span className="pricing-access">Launch Access</span>
                <div>
                  <span className="eyebrow">TradeOps Pro</span>
                  <h3>$29/mo</h3>
                  <p>Cross-market watchlists, thesis, trigger, risk framing, and Discord access.</p>
                </div>
              </div>
              <ul>
                <li>Daily stock and crypto watchlist</li>
                <li>Long and short focus</li>
                <li>Discord member access</li>
                <li>Tracked attribution into checkout</li>
              </ul>
              {discordSession ? (
                <div className="join-status-pill join-status-pill-confirmed">
                  Discord connected: {connectedDiscordLabel}. Checkout can provision access automatically.
                </div>
              ) : (
                <div className="join-status-pill">
                  Connect Discord before checkout so the Lemon webhook can grant Pro access automatically.
                </div>
              )}
              <div className="pricing-card-actions pricing-card-actions-stack">
                <CheckoutButton
                  className="button button-primary"
                  amount={29}
                  planId="tradeops_pro"
                  planName="TradeOps Pro"
                  discordUserId={discordSession?.userId || ""}
                >
                  Start Checkout
                </CheckoutButton>
                <TrackedActionLink
                  className="button button-secondary"
                  href={connectHref}
                  eventType="discord_button_click"
                  metadata={{ destination: "discord_oauth_connect", page_type: "pricing" }}
                >
                  {discordSession ? "Reconnect Discord" : "Connect Discord First"}
                </TrackedActionLink>
                <TrackedActionLink
                  className="button button-secondary"
                  href={discordUrl}
                  eventType="discord_button_click"
                  metadata={{ destination: "discord_join", page_type: "pricing" }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join the Discord First
                </TrackedActionLink>
              </div>
            </article>
          </div>
        </section>

        <section className="subpage-panel">
          <div className="section-heading">
            <span className="eyebrow">Warm Lead Capture</span>
            <h2>Capture email before checkout if needed.</h2>
            <p>
              If checkout is not configured yet, the funnel can still capture intent on the pricing
              page and resolve that visitor later when Discord or payments are connected.
            </p>
          </div>
          <EmailCaptureForm formName="pricing_page_capture" />
        </section>
      </main>
    </AttributionPage>
  );
}
