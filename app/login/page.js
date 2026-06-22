import { redirect } from "next/navigation";

import { getDiscordOAuthConfig } from "../../lib/discord-oauth";
import { getCurrentMemberSession, isMemberAuthConfigured, sanitizeInternalRedirectPath } from "../../lib/member-auth";


export const metadata = {
  title: "TradeOps | Login",
  description: "Discord login for TradeOps Pro members.",
};

export const dynamic = "force-dynamic";


export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const redirectTo = sanitizeInternalRedirectPath(resolvedSearchParams.redirect || "/dashboard");
  const session = await getCurrentMemberSession();
  if (session) {
    redirect(redirectTo);
  }

  const authConfigured = isMemberAuthConfigured();
  const discordConfigured = Boolean(getDiscordOAuthConfig().clientId);
  const connectHref = `/api/discord/oauth/start?return_to=%2Fjoin&redirect=${encodeURIComponent(redirectTo)}`;
  const errorMessage = String(resolvedSearchParams.error || "").trim();

  return (
    <main className="page-shell subpage-shell">
      <section className="subpage-hero">
        <div className="section-heading">
          <span className="eyebrow">Member Login</span>
          <h1>Open your TradeOps dashboard.</h1>
          <p>
            TradeOps Pro members use Discord login to access the Morning Edge dashboard, current
            research packet, recent archive, and linked Discord Pro access from one account flow.
          </p>
        </div>
      </section>

      <section className="subpage-panel">
        <div className="section-heading">
          <span className="eyebrow">Discord First</span>
          <h2>Continue with the Discord account you use for TradeOps.</h2>
          <p>
            If your Discord account is already linked to an active TradeOps Pro membership, the
            dashboard opens immediately. If your purchase used a different billing email, the join
            page will let you claim access after Discord sign-in.
          </p>
        </div>
        {errorMessage ? (
          <div className="join-status-pill">{errorMessage}</div>
        ) : null}
        {authConfigured && discordConfigured ? (
          <div className="subpage-actions">
            <a className="button button-primary" href={connectHref}>
              Continue with Discord
            </a>
          </div>
        ) : (
          <div className="join-status-pill">
            Member login is not configured yet. Add `DATABASE_URL` and Discord OAuth settings to
            enable the portal.
          </div>
        )}
      </section>
    </main>
  );
}
