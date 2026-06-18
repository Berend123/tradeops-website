import { cookies } from "next/headers";

import { AttributionPage } from "../components/attribution-page";
import DiscordActivationForm from "../components/discord-activation-form";
import TrackedActionLink from "../components/tracked-action-link";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../lib/discord-oauth";
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


function buildDiscordConnectHref({
  returnTo = "/join",
  searchParams = {},
}) {
  const params = new URLSearchParams();
  params.set("return_to", returnTo);
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (key === "discord") {
      continue;
    }
    const normalized = String(value || "").trim();
    if (!normalized) {
      continue;
    }
    params.set(key, normalized);
  }
  return `/api/discord/oauth/start?${params.toString()}`;
}

export default async function JoinPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const cookieStore = await cookies();
  const discordSession = parseDiscordSession(cookieStore.get(DISCORD_SESSION_COOKIE)?.value || "");
  const joinState = resolveJoinPageState(resolvedSearchParams);
  const joinCopy = buildJoinCopy(joinState);
  const supportEmail = getSupportEmail();
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";
  const connectHref = buildDiscordConnectHref({
    returnTo: "/join",
    searchParams: resolvedSearchParams,
  });
  const connectedDiscordLabel = discordSession?.globalName || discordSession?.username || discordSession?.userId || "";

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
            {discordSession ? (
              <TrackedActionLink
                className="button button-primary"
                href={discordUrl}
                eventType="discord_button_click"
                metadata={{
                  destination: "discord_join",
                  page_type: "join",
                  checkout_confirmed: joinState.checkoutConfirmed,
                  discord_connected: true,
                }}
                target="_blank"
                rel="noreferrer"
              >
                Open the TradeOps Discord
              </TrackedActionLink>
            ) : (
              <TrackedActionLink
                className="button button-primary"
                href={connectHref}
                eventType="discord_button_click"
                metadata={{
                  destination: "discord_oauth_connect",
                  page_type: "join",
                  checkout_confirmed: joinState.checkoutConfirmed,
                }}
              >
                Connect Discord
              </TrackedActionLink>
            )}
            <TrackedActionLink
              className="button button-secondary"
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
              Use Invite Link
            </TrackedActionLink>
            <a className="button button-secondary" href={`mailto:${supportEmail}`}>
              Contact Support
            </a>
          </div>
        </section>

        <section className="subpage-panel">
          <DiscordActivationForm
            checkoutConfirmed={joinState.checkoutConfirmed}
            connectedDiscordUserId={discordSession?.userId || ""}
            connectedDiscordLabel={connectedDiscordLabel}
            connectedEmail={discordSession?.email || ""}
            connectHref={connectHref}
          />
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
              <h3>Connect your Discord account</h3>
              <p>Use the connect button above so TradeOps can join your Discord account to the server directly.</p>
            </article>
            <article className="join-step">
              <span className="join-step-index">02</span>
              <h3>Checkout with Discord already linked</h3>
              <p>
                If Discord is connected before payment, the checkout metadata carries your Discord user
                ID so the Lemon webhook can grant Pro access automatically after payment.
              </p>
            </article>
            <article className="join-step">
              <span className="join-step-index">03</span>
              <h3>Use manual activation only as fallback</h3>
              <p>
                If you paid before linking Discord or the emails do not line up, use the activation form
                above. If anything still looks wrong, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>{" "}
                and include your checkout receipt details.
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
