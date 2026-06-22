import { cookies } from "next/headers";

import { AttributionPage } from "../components/attribution-page";
import DiscordActivationForm from "../components/discord-activation-form";
import TrackedActionLink from "../components/tracked-action-link";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../../lib/discord-oauth";
import { resolveJoinPageState } from "../../lib/join-page-state.mjs";
import { getCurrentMemberSession, sanitizeInternalRedirectPath } from "../../lib/member-auth";
import { getMemberAccessStateForUser } from "../../lib/member-subscriptions";

export const metadata = {
  title: "TradeOps | Join",
  description: "Post-purchase claim flow for the TradeOps dashboard and Discord Pro access.",
};

function buildJoinCopy(joinState) {
  if (joinState.checkoutConfirmed) {
    return {
      eyebrow: "Access Confirmed",
      title: "Your TradeOps subscription is active.",
      summary:
        "Use the buttons below to open the TradeOps dashboard and connect Discord. Morning Edge briefings, research context, risk framing, priority boards, and community access now span both the website dashboard and the Discord server.",
      status:
        "Checkout confirmation metadata was detected on this page, so we can safely show the membership-active state.",
    };
  }

  return {
    eyebrow: "Discord Access",
    title: "Use this page to enter the TradeOps Discord.",
    summary:
      "TradeOps is a market-intelligence membership with a Morning Edge website dashboard and Discord delivery/community layer. Members receive market weather, a trade read, best long and short, priority tiers, catalyst analysis, risk framing, and archive access. If you already subscribed, use the buttons below to access the dashboard and connect Discord.",
    status:
      "This page does not see confirmed checkout metadata yet, so it shows the access instructions without claiming payment is complete.",
  };
}

function buildJoinNotice({
  hasDiscordSession,
  hasActivePro,
  requiresClaim,
  redirectTo,
}) {
  if (hasActivePro) {
    return {
      tone: "confirmed",
      text: "Discord is linked and your TradeOps Pro access is active.",
    };
  }
  if (requiresClaim && hasDiscordSession) {
    return {
      tone: "",
      text: `Discord is connected. Finish the claim below using the checkout email tied to your subscription, then you will be sent to ${redirectTo}.`,
    };
  }
  if (hasDiscordSession) {
    return {
      tone: "",
      text: "Discord is connected. If your subscription used a different email, finish the claim below.",
    };
  }
  return {
    tone: "",
    text: "Connect Discord first, then claim access with the checkout email tied to your Lemon Squeezy subscription.",
  };
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
  const memberSession = await getCurrentMemberSession().catch(() => null);
  const access = memberSession?.userId ? await getMemberAccessStateForUser(memberSession.userId).catch(() => null) : null;
  const joinState = resolveJoinPageState(resolvedSearchParams);
  const joinCopy = buildJoinCopy(joinState);
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";
  const redirectTo = sanitizeInternalRedirectPath(resolvedSearchParams.redirect || "/dashboard");
  const connectHref = buildDiscordConnectHref({
    returnTo: "/join",
    searchParams: {
      ...resolvedSearchParams,
      redirect: redirectTo,
    },
  });
  const connectedDiscordLabel = discordSession?.globalName || discordSession?.username || discordSession?.userId || "";
  const joinNotice = buildJoinNotice({
    hasDiscordSession: Boolean(discordSession?.userId),
    hasActivePro: Boolean(access?.hasActivePro),
    requiresClaim: String(resolvedSearchParams.claim || "").trim().toLowerCase() === "required",
    redirectTo,
  });

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
            className={`join-status-pill${joinState.checkoutConfirmed || joinNotice.tone === "confirmed" ? " join-status-pill-confirmed" : ""}`}
          >
            {joinNotice.text || joinCopy.status}
          </div>

          <div className="subpage-actions">
            {access?.hasActivePro ? (
              <a className="button button-primary" href="/dashboard">
                Open dashboard
              </a>
            ) : discordSession ? (
              <a className="button button-primary" href="#claim-access">
                Claim dashboard access
              </a>
            ) : (
              <a className="button button-primary" href={connectHref}>
                Continue with Discord
              </a>
            )}
            {discordSession ? (
              <TrackedActionLink
                className="button button-secondary"
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
                className="button button-secondary"
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
          </div>
        </section>

        <section className="subpage-panel">
          <DiscordActivationForm
            id="claim-access"
            checkoutConfirmed={joinState.checkoutConfirmed}
            connectedDiscordUserId={discordSession?.userId || ""}
            connectedDiscordLabel={connectedDiscordLabel}
            connectHref={connectHref}
            redirectTo={redirectTo}
            hasActivePro={Boolean(access?.hasActivePro)}
          />
        </section>

        <section className="subpage-panel">
          <div className="section-heading">
            <span className="eyebrow">What Members Receive</span>
            <h2>Morning briefings, not noise.</h2>
            <p>
              TradeOps focuses on actionable stock and crypto intelligence across the hosted Morning
              Edge dashboard and the Discord Pro community: catalyst framing, scenario thinking, risk
              context, priority boards, and structured market prep.
            </p>
          </div>

          <div className="join-steps">
            <article className="join-step">
              <span className="join-step-index">01</span>
              <h3>Start with Discord login</h3>
              <p>Use Discord as the TradeOps member login so the website dashboard and Discord Pro access stay tied to one identity.</p>
            </article>
            <article className="join-step">
              <span className="join-step-index">02</span>
              <h3>Let TradeOps join the server</h3>
              <p>Use the connect button above so TradeOps can attach your Discord account to the guild and sync the Pro role automatically.</p>
            </article>
            <article className="join-step">
              <span className="join-step-index">03</span>
              <h3>Claim access with your checkout email if needed</h3>
              <p>
                If you checked out with the same email Discord returned, access can link automatically. If not, use the claim form above with the checkout email tied to your Lemon Squeezy purchase.
              </p>
            </article>
            <article className="join-step">
              <span className="join-step-index">04</span>
              <h3>Open the dashboard after the claim succeeds</h3>
              <p>
                Once the claim completes, the site starts your member session and sends you straight into the Morning Edge dashboard. If anything still looks wrong, reopen the Discord invite above and ask for help inside the server.
              </p>
            </article>
          </div>
        </section>

        <section className="subpage-panel">
          <div className="section-heading">
            <span className="eyebrow">Help</span>
            <h2>Need help getting in?</h2>
            <p>
              Use the TradeOps Discord and talk to Berend if you need help finishing the claim or
              linking the correct account.
            </p>
            <div className="subpage-actions">
              <TrackedActionLink
                className="button button-secondary"
                href={discordUrl}
                eventType="discord_button_click"
                metadata={{
                  destination: "discord_join",
                  page_type: "join",
                  checkout_confirmed: joinState.checkoutConfirmed,
                  support_intent: true,
                }}
                target="_blank"
                rel="noreferrer"
              >
                Open TradeOps Discord
              </TrackedActionLink>
            </div>
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
