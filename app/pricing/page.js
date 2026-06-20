import { cookies } from "next/headers";

import { AttributionPage } from "../components/attribution-page";
import CheckoutButton from "../components/checkout-button";
import EmailCaptureForm from "../components/email-capture-form";
import TrackedActionLink from "../components/tracked-action-link";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../lib/discord-oauth";


export const metadata = {
  title: "TradeOps | Pricing",
  description: "TradeOps pricing for the Morning Edge Discord briefing and Pro access.",
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
              TradeOps Pro gives you the Morning Edge briefing in Discord: market weather, a trade
              read, best long, best short, a priority board, market confirmation, and risk framing.
            </p>
          </div>

          <div className="pricing-grid pricing-grid-single">
            <article className="pricing-card pricing-card-primary">
              <div className="pricing-card-head">
                <span className="pricing-access">Launch Access</span>
                <div>
                  <span className="eyebrow">TradeOps Pro</span>
                  <h3>$29/mo</h3>
                  <p>Daily Morning Edge briefings, priority tiers, and Pro Discord access.</p>
                </div>
              </div>
              <ul>
                <li>Daily Morning Edge briefing in Discord</li>
                <li>Best long and best short</li>
                <li>Priority 1 / 2 / 3 board</li>
                <li>Market confirmation and avoid notes</li>
                <li>Discord member access</li>
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
            <span className="eyebrow">Need More Time?</span>
            <h2>Leave your email before checkout if needed.</h2>
            <p>
              If you are not ready to check out yet, you can still capture your place and come back
              after you decide the Morning Edge format fits your process.
            </p>
          </div>
          <EmailCaptureForm formName="pricing_page_capture" />
        </section>
      </main>
    </AttributionPage>
  );
}
