import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "../components/logout-button";
import { getCurrentMemberSession } from "../../lib/member-auth";
import { getMemberAccessStateForUser } from "../../lib/member-subscriptions";


export const metadata = {
  title: "TradeOps | Account",
  description: "Manage your TradeOps member access, Discord link, and billing.",
};

export const dynamic = "force-dynamic";


function buildDiscordConnectHref() {
  return "/api/discord/oauth/start?return_to=%2Faccount";
}


export default async function AccountPage() {
  const session = await getCurrentMemberSession();
  if (!session) {
    redirect("/login?redirect=%2Faccount");
  }

  const access = await getMemberAccessStateForUser(session.userId);
  const discordLink = access.discordLink;
  const subscription = access.subscription;
  const connectedLabel =
    discordLink?.discordGlobalName || discordLink?.discordUsername || discordLink?.discordUserId || "";
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";

  return (
    <main className="page-shell subpage-shell">
      <section className="subpage-hero">
        <div className="section-heading">
          <span className="eyebrow">Account</span>
          <h1>Manage your TradeOps member access.</h1>
          <p>
            This page shows the shared Pro entitlement that controls both the website dashboard and
            Discord Pro access.
          </p>
        </div>
        <div className="subpage-actions">
          {access.hasActivePro ? (
            <Link className="button button-primary" href="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <Link className="button button-primary" href="/pricing">
              Upgrade to Pro
            </Link>
          )}
          <LogoutButton />
        </div>
      </section>

      <section className="subpage-panel">
        <div className="member-grid member-grid-two">
          <article className="member-card">
            <span className="eyebrow">Login Identity</span>
            <h2>{connectedLabel || "Discord-linked member session"}</h2>
            <p>
              {discordLink
                ? `Website access is currently linked to ${connectedLabel}. Billing identity on file: ${session.email}.`
                : `Website access is active, but this account has not finished linking a Discord identity yet. Billing identity on file: ${session.email}.`}
            </p>
          </article>
          <article className="member-card">
            <span className="eyebrow">Pro Entitlement</span>
            <h2>{access.hasActivePro ? "Active" : "Inactive"}</h2>
            <p>
              {access.entitlement?.expiresAt
                ? `Access valid through ${access.entitlement.expiresAt}.`
                : access.hasActivePro
                  ? "No expiry date is currently stored for this entitlement."
                  : "Upgrade to Pro to unlock the dashboard and Discord Pro role."}
            </p>
          </article>
        </div>
      </section>

      <section className="subpage-panel">
        <div className="member-grid member-grid-two">
          <article className="member-card">
            <span className="eyebrow">Discord</span>
            <h2>{discordLink ? "Linked" : "Not linked"}</h2>
            <p>
              {discordLink
                ? `Connected account: ${connectedLabel}`
                : "Link Discord so the shared TradeOps Pro entitlement can sync the premium role automatically."}
            </p>
            <div className="subpage-actions">
              <a className="button button-secondary" href={buildDiscordConnectHref()}>
                {discordLink ? "Refresh Discord link" : "Link Discord"}
              </a>
              <a className="button button-secondary" href={discordUrl} target="_blank" rel="noreferrer">
                Open Discord
              </a>
            </div>
          </article>

          <article className="member-card">
            <span className="eyebrow">Billing</span>
            <h2>{subscription?.status || "No subscription found"}</h2>
            <p>
              {subscription?.planName
                ? `${subscription.planName}${subscription.variantId ? ` | Variant ${subscription.variantId}` : ""}`
                : "Billing details are populated from Lemon Squeezy webhook and backfill syncs."}
            </p>
            <div className="subpage-actions">
              <a className="button button-secondary" href="/api/account/billing">
                Manage billing
              </a>
              {!access.hasActivePro ? (
                <Link className="button button-secondary" href="/pricing">
                  View pricing
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
