import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMemberSession } from "../../../lib/member-auth";
import { listRecentDashboardSnapshots } from "../../../lib/member-db";
import { getMemberAccessStateForUser } from "../../../lib/member-subscriptions";


export const metadata = {
  title: "TradeOps | Dashboard History",
  description: "Recent TradeOps Morning Edge snapshots for Pro members.",
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


export default async function DashboardHistoryPage() {
  const session = await getCurrentMemberSession();
  if (!session) {
    redirect("/login?redirect=%2Fdashboard%2Fhistory");
  }

  const access = await getMemberAccessStateForUser(session.userId);
  if (!access.hasActivePro) {
    redirect("/dashboard");
  }

  const snapshots = await listRecentDashboardSnapshots({ scope: "cross_market", limit: 7 });

  return (
    <main className="page-shell subpage-shell">
      <section className="subpage-hero">
        <div className="section-heading">
          <span className="eyebrow">History</span>
          <h1>Last 7 Morning Edge snapshots.</h1>
          <p>
            This is the recent published archive from the cross-market member snapshot store. It is
            meant for review and continuity, not as a substitute for the current session board.
          </p>
        </div>
        <div className="subpage-actions">
          <Link className="button button-secondary" href="/dashboard">
            Back to current dashboard
          </Link>
        </div>
      </section>

      <section className="subpage-panel">
        {snapshots.length === 0 ? (
          <div className="join-status-pill">
            No published history exists yet. The dashboard archive will appear once snapshots are
            being written into Neon.
          </div>
        ) : (
          <div className="member-history-list">
            {snapshots.map((snapshot) => {
              const payload = snapshot.payloadJson || {};
              return (
                <article key={snapshot.id} className="member-card member-history-card">
                  <div className="member-history-header">
                    <div>
                      <span className="eyebrow">{snapshot.snapshotDate}</span>
                      <h2>{payload.mode_title || "TradeOps Morning Edge"}</h2>
                    </div>
                    <span className="member-history-mode">{payload.market_weather || snapshot.mode}</span>
                  </div>
                  <div className="member-grid member-grid-two">
                    <div>
                      <span className="eyebrow">TradeOps Read</span>
                      {renderLines(payload.tradeops_read || [])}
                    </div>
                    <div>
                      <span className="eyebrow">Priority 1</span>
                      {renderLines(payload.priority_board?.priority_1 || [])}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
