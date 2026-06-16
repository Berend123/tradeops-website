import { AttributionPage } from "../components/attribution-page";
import TrackedActionLink from "../components/tracked-action-link";
import { resolveJoinPageState } from "../../lib/join-page-state.mjs";

export const metadata = {
  title: "TradeOps | Join",
  description: "Post-purchase Discord access and attribution-safe onboarding for TradeOps members.",
};

function buildJoinCopy(joinState) {
  if (joinState.checkoutConfirmed) {
    return {
      eyebrow: "Access Confirmed",
      title: "Your TradeOps subscription is active.",
      summary:
        "Use the Discord button below to enter the TradeOps server and complete member onboarding. Daily stock and crypto watchlists, catalyst analysis, risk framing, and community access are delivered there.",
      status:
        "Checkout confirmation metadata was detected on this page, so we can safely show the membership-active state.",
    };
  }

  return {
    eyebrow: "Discord Access",
    title: "Use this page to enter the TradeOps Discord.",
    summary:
      "TradeOps is a Discord-delivered market intelligence membership. Members receive daily stock and crypto watchlists, catalyst analysis, risk framing, and community access. If you already subscribed, use the button below to access Discord. If you arrived here from X or another tracked link, your attribution data will be preserved.",
    status:
      "This page does not see confirmed checkout metadata yet, so it shows the access instructions without claiming payment is complete.",
  };
}

function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@tradeops.org";
}

export default async function JoinPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const joinState = resolveJoinPageState(resolvedSearchParams);
  const joinCopy = buildJoinCopy(joinState);
  const supportEmail = getSupportEmail();
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";

  return (
    <AttributionPage
      pageType="join"
      pageViewMetadata={{
        checkout_confirmed: joinState.checkoutConfirmed,
        confirmation_key: joinState.confirmationKey,
        confirmation_reference_key: joinState.confirmationReferenceKey,
      }}
    >
      <main className="page-shell subpage-shell">
        <section className="subpage-hero">
          <div className="section-heading">
            <span className="eyebrow">{joinCopy.eyebrow}</span>
            <h1>{joinCopy.title}</h1>
            <p>{joinCopy.summary}</p>
          </div>

          <div
            className={`join-status-pill${joinState.checkoutConfirmed ? " join-status-pill-confirmed" : ""}`}
          >
            {joinCopy.status}
          </div>

          <div className="subpage-actions">
            <TrackedActionLink
              className="button button-primary"
              href={discordUrl}
              eventType="discord_button_click"
              metadata={{
                destination: "discord_join",
                page_type: "join",
                checkout_confirmed: joinState.checkoutConfirmed,
              }}
              target="_blank"
              rel="noreferrer"
            >
              Join the TradeOps Discord
            </TrackedActionLink>
            <a className="button button-secondary" href={`mailto:${supportEmail}`}>
              Contact Support
            </a>
          </div>
        </section>

        <section className="subpage-panel">
          <div className="section-heading">
            <span className="eyebrow">What Members Receive</span>
            <h2>Daily research, not noise.</h2>
            <p>
              TradeOps focuses on actionable stock and crypto intelligence delivered inside Discord:
              daily watchlists, catalyst framing, scenario thinking, risk context, and a community
              built around structured market prep.
            </p>
          </div>

          <div className="join-steps">
            <article className="join-step">
              <span className="join-step-index">01</span>
              <h3>Open the Discord invite</h3>
              <p>Use the button above to enter the TradeOps server with the current invite link.</p>
            </article>
            <article className="join-step">
              <span className="join-step-index">02</span>
              <h3>Use the same purchase identity</h3>
              <p>
                If you subscribed, join with the same email identity you used at checkout so support
                can reconcile access quickly if anything needs manual review.
              </p>
            </article>
            <article className="join-step">
              <span className="join-step-index">03</span>
              <h3>Escalate access issues fast</h3>
              <p>
                If Discord access or member permissions do not look right, email{" "}
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a> and include your checkout
                receipt details.
              </p>
            </article>
          </div>
        </section>

        <section className="subpage-panel">
          <div className="section-heading">
            <span className="eyebrow">Support</span>
            <h2>Need help getting in?</h2>
            <p>
              Support: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </p>
            <p className="join-disclaimer">
              TradeOps provides market research and educational content only. It is not financial,
              investment, tax, or legal advice.
            </p>
          </div>
        </section>
      </main>
    </AttributionPage>
  );
}
