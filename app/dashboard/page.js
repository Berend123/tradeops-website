import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMemberSession } from "../../lib/member-auth";
import { getCurrentDashboardSnapshot } from "../../lib/member-db";
import { getMemberAccessStateForUser } from "../../lib/member-subscriptions";


export const metadata = {
  title: "TradeOps | Dashboard",
  description: "The current TradeOps Morning Edge dashboard for Pro members.",
};

export const dynamic = "force-dynamic";


function renderLines(lines = []) {
  return (
    <ul className="member-bullet-list">
      {lines.filter(Boolean).map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}


function renderTextValue(value, fallback) {
  if (Array.isArray(value)) {
    const lines = value.filter(Boolean);
    return lines.length > 0 ? lines.join(" ") : fallback;
  }
  return value || fallback;
}


function renderBestCard(title, entry) {
  if (!entry) {
    return null;
  }
  return (
    <article className="member-card member-card-setup">
      <span className="eyebrow">{title}</span>
      <h3>{entry.ticker}</h3>
      <p className="member-card-meta">
        Catalyst: {entry.catalyst_tag} | Conviction: {entry.conviction_score}/5 | Risk: {entry.risk_score}/5
      </p>
      {renderLines(entry.reasoning_lines || [])}
      <p><strong>Confirmation:</strong> {entry.confirmation}</p>
      <p><strong>Invalidation:</strong> {entry.invalidation}</p>
    </article>
  );
}


export default async function DashboardPage() {
  const session = await getCurrentMemberSession();
  if (!session) {
    redirect("/login?redirect=%2Fdashboard");
  }

  const access = await getMemberAccessStateForUser(session.userId);
  if (!access.hasActivePro) {
    return (
      <main className="page-shell subpage-shell">
        <section className="subpage-hero">
          <div className="section-heading">
            <span className="eyebrow">Upgrade Required</span>
            <h1>Your TradeOps account is active, but Pro access is not.</h1>
            <p>
              Sign-in succeeded, but the shared Pro entitlement is not currently active. Upgrade or
              reactivate your membership to open the Morning Edge dashboard and Pro Discord access.
            </p>
          </div>
          <div className="subpage-actions">
            <Link className="button button-primary" href="/pricing">
              View pricing
            </Link>
            <Link className="button button-secondary" href="/account">
              Open account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const snapshot = await getCurrentDashboardSnapshot("cross_market");
  const payload = snapshot?.payloadJson || {};
  const researchSections = payload.research_sections || {};
  const bestLong = payload.best_long || null;
  const bestShort = payload.best_short || null;
  const priorityBoard = payload.priority_board || {};

  return (
    <main className="page-shell subpage-shell">
      <section className="subpage-hero">
        <div className="section-heading">
          <span className="eyebrow">Pro Dashboard</span>
          <h1>{payload.mode_title || "TradeOps Morning Edge"}</h1>
          <p>
            Current session surface for Pro members. This mirrors the final Morning Edge brief that
            the pipeline published to the member data store.
          </p>
        </div>
        <div className="member-kicker-grid">
          <article className="member-kicker-card">
            <span className="eyebrow">Market Weather</span>
            <h2>{payload.market_weather || "Unavailable"}</h2>
          </article>
          <article className="member-kicker-card">
            <span className="eyebrow">Snapshot Date</span>
            <h2>{snapshot?.snapshotDate || "Unavailable"}</h2>
          </article>
          <article className="member-kicker-card">
            <span className="eyebrow">Mode</span>
            <h2>{payload.mode || snapshot?.mode || "Unavailable"}</h2>
          </article>
        </div>
      </section>

      {!snapshot ? (
        <section className="subpage-panel">
          <div className="join-status-pill">
            No published dashboard snapshot is available yet. The website is ready, but the pipeline
            has not published a member-facing snapshot into Neon.
          </div>
        </section>
      ) : (
        <>
          <section className="subpage-panel">
            <div className="member-grid member-grid-two">
              <article className="member-card">
                <span className="eyebrow">Market Regime</span>
                {renderLines(payload.market_regime || [])}
              </article>
              <article className="member-card">
                <span className="eyebrow">TradeOps Read</span>
                {renderLines(payload.tradeops_read || [])}
              </article>
            </div>
          </section>

          <section className="subpage-panel">
            <div className="member-grid member-grid-two">
              {renderBestCard("Best Long", bestLong)}
              {renderBestCard("Best Short", bestShort)}
            </div>
          </section>

          <section className="subpage-panel">
            <div className="section-heading">
              <span className="eyebrow">Priority Board</span>
              <h2>Where attention belongs first.</h2>
            </div>
            <div className="member-grid member-grid-three">
              <article className="member-card">
                <span className="eyebrow">Priority 1</span>
                {renderLines(priorityBoard.priority_1 || [])}
              </article>
              <article className="member-card">
                <span className="eyebrow">Priority 2</span>
                {renderLines(priorityBoard.priority_2 || [])}
              </article>
              <article className="member-card">
                <span className="eyebrow">Priority 3</span>
                {renderLines(priorityBoard.priority_3 || [])}
              </article>
            </div>
          </section>

          <section className="subpage-panel">
            <div className="member-grid member-grid-two">
              <article className="member-card">
                <span className="eyebrow">Market Confirmation</span>
                {payload.market_confirmation ? (
                  <>
                    <h3>{payload.market_confirmation.ticker}</h3>
                    {renderLines(payload.market_confirmation.lines || [])}
                  </>
                ) : (
                  <p>No separate confirmation signal was published for this session.</p>
                )}
              </article>
              <article className="member-card">
                <span className="eyebrow">Avoid</span>
                {renderLines(payload.avoid || [])}
              </article>
            </div>
          </section>

          <section className="subpage-panel">
            <div className="section-heading">
              <span className="eyebrow">Research Sections</span>
              <h2>Context behind the board.</h2>
            </div>
            <div className="member-grid member-grid-two">
              <article className="member-card">
                <span className="eyebrow">Sector Rotation</span>
                <p>{renderTextValue(researchSections.sector_rotation, "No sector rotation summary was published.")}</p>
              </article>
              <article className="member-card">
                <span className="eyebrow">Catalyst Themes</span>
                <p>{renderTextValue(researchSections.catalyst_themes, "No catalyst summary was published.")}</p>
              </article>
              <article className="member-card">
                <span className="eyebrow">Sentiment</span>
                <p>{renderTextValue(researchSections.sentiment, "No sentiment summary was published.")}</p>
              </article>
              <article className="member-card">
                <span className="eyebrow">Crypto Context</span>
                <p>{renderTextValue(researchSections.crypto_context, "No crypto context summary was published.")}</p>
              </article>
              <article className="member-card">
                <span className="eyebrow">Macro Context</span>
                <p>{renderTextValue(researchSections.macro_context, "No macro summary was published.")}</p>
              </article>
              <article className="member-card">
                <span className="eyebrow">Risk Factors</span>
                {renderLines(researchSections.risk_factors || [])}
              </article>
            </div>
          </section>

          <section className="subpage-panel">
            <div className="subpage-actions">
              <Link className="button button-primary" href="/dashboard/history">
                View 7-day history
              </Link>
              <Link className="button button-secondary" href="/account">
                Open account
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
