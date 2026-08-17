import Image from "next/image";

import { AttributionPage } from "../components/attribution-page";
import TrackedActionLink from "../components/tracked-action-link";


export const metadata = {
  title: "TradeOps Affiliate Program | Partner With TradeOps",
  description:
    "Apply to the TradeOps affiliate program and earn commission by introducing active traders to the Morning Edge market briefing.",
  alternates: {
    canonical: "https://tradeops.org/affiliates",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TradeOps Affiliate Program",
    description: "Partner with TradeOps and introduce traders to a sharper morning market process.",
    url: "/affiliates",
    type: "website",
  },
};

const fitCards = [
  {
    index: "01",
    title: "Trading creators",
    copy: "X, YouTube, newsletter, and educational creators whose audiences actively follow stocks, crypto, or macro markets.",
  },
  {
    index: "02",
    title: "Community operators",
    copy: "Discord owners and moderators building useful trading communities without relying on spam or exaggerated promises.",
  },
  {
    index: "03",
    title: "Market educators",
    copy: "Educators who teach process, risk, catalyst research, and independent decision-making rather than guaranteed outcomes.",
  },
];

const applicationSteps = [
  ["Apply", "Tell us where you publish, who you serve, and how TradeOps fits your audience."],
  ["Review", "TradeOps reviews audience fit and promotion methods before approving access."],
  ["Share", "Approved partners receive a unique Lemon Squeezy referral link and program resources."],
  ["Earn", "Lemon Squeezy records eligible referrals and manages affiliate reporting and payouts."],
];

const rules = [
  "Disclose the affiliate relationship clearly.",
  "Use accurate product claims and current TradeOps pricing.",
  "Do not promise profits, returns, win rates, or guaranteed outcomes.",
  "Do not use unsolicited bulk messages, fake engagement, or impersonation.",
  "Do not bid on TradeOps brand terms or misrepresent yourself as TradeOps staff.",
  "Referred purchases remain subject to the normal refund and subscription terms.",
];

export default function AffiliatesPage() {
  const signupUrl = process.env.NEXT_PUBLIC_AFFILIATE_SIGNUP_URL
    || "https://tradeopshq.lemonsqueezy.com/affiliates";
  const commissionLabel = process.env.NEXT_PUBLIC_AFFILIATE_COMMISSION_LABEL || "30% recurring commission";
  const trackingLabel = process.env.NEXT_PUBLIC_AFFILIATE_TRACKING_LABEL
    || "30-day tracking window";
  const usesApplicationLink = signupUrl.startsWith("http");

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TradeOps",
    url: "https://tradeops.org",
    description: "Market intelligence with a clear operating hierarchy for active traders.",
  };

  return (
    <AttributionPage pageType="affiliate" pageViewMetadata={{ program: "tradeops_affiliate" }}>
      <main className="page-shell subpage-shell affiliate-shell">
        <div className="background-grid" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        <section className="affiliate-hero">
          <div className="affiliate-hero-copy">
            <a className="affiliate-back-link" href="/">TradeOps / Partner Program</a>
            <span className="eyebrow">Selective Partnerships</span>
            <h1>Bring traders a better filter.</h1>
            <p>
              TradeOps partners with credible creators, educators, and community operators who help
              active traders find the few market catalysts that actually deserve attention.
            </p>
            <div className="subpage-actions affiliate-actions">
              <TrackedActionLink
                className="button button-primary"
                href={signupUrl}
                preserveAttribution={false}
                eventType="affiliate_application_click"
                metadata={{ destination: usesApplicationLink ? "lemon_squeezy" : "email" }}
                target={usesApplicationLink ? "_blank" : undefined}
                rel={usesApplicationLink ? "noreferrer" : undefined}
              >
                {usesApplicationLink ? "Apply to the program" : "Request an affiliate invite"}
              </TrackedActionLink>
              <a className="button button-secondary" href="/#sample-brief">Review the product</a>
            </div>
            <p className="affiliate-fine-print">Applications are reviewed for audience and promotion fit.</p>
          </div>

          <aside className="affiliate-program-card" aria-label="Affiliate program summary">
            <div className="affiliate-card-head">
              <Image src="/TradeOpsLogoTransparent.png" alt="TradeOps" width={70} height={70} />
              <div><span>Program</span><strong>TradeOps Partners</strong></div>
            </div>
            <dl className="affiliate-metrics">
              <div><dt>Reward</dt><dd>{commissionLabel}</dd></div>
              <div><dt>Tracking</dt><dd>{trackingLabel}</dd></div>
              <div><dt>Platform</dt><dd>Lemon Squeezy</dd></div>
              <div><dt>Review</dt><dd>Application required</dd></div>
            </dl>
            <div className="affiliate-status"><span /> Program accepting applications</div>
          </aside>
        </section>

        <section className="affiliate-section affiliate-value-grid">
          <div>
            <span className="eyebrow">The Product</span>
            <h2>A useful product is easier to recommend.</h2>
          </div>
          <div className="affiliate-value-copy">
            <p>
              TradeOps turns fragmented stock, crypto, macro, and cross-market information into a
              ranked Morning Edge briefing. Members see market weather, the best long and short,
              priority tiers, confirmation criteria, invalidation, and what to avoid.
            </p>
            <p>
              Partners are not asked to sell signals. The value is the filtering process: less noise,
              clearer hierarchy, and a faster morning workflow for active traders.
            </p>
          </div>
        </section>

        <section className="affiliate-section">
          <div className="section-heading">
            <span className="eyebrow">Who Fits</span>
            <h2>Built for trusted market audiences.</h2>
          </div>
          <div className="affiliate-fit-grid">
            {fitCards.map((card) => (
              <article key={card.index}>
                <span>{card.index}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="affiliate-section affiliate-process-panel">
          <div className="section-heading">
            <span className="eyebrow">How It Works</span>
            <h2>One controlled path from application to payout.</h2>
          </div>
          <ol className="affiliate-process-list">
            {applicationSteps.map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="affiliate-section affiliate-rules-grid">
          <div>
            <span className="eyebrow">Promotion Standard</span>
            <h2>Protect the audience and the brand.</h2>
            <p>
              TradeOps grows through useful market work, not aggressive claims. Partners should sound
              like responsible market operators, not mass-market promoters.
            </p>
          </div>
          <ul>
            {rules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </section>

        <section className="affiliate-cta">
          <div>
            <span className="eyebrow">Partner With TradeOps</span>
            <h2>If the product fits your audience, start here.</h2>
            <p>Tell us about your platform, audience, and the way you would introduce TradeOps.</p>
          </div>
          <TrackedActionLink
            className="button button-primary"
            href={signupUrl}
            preserveAttribution={false}
            eventType="affiliate_application_click"
            metadata={{ destination: usesApplicationLink ? "lemon_squeezy" : "email", placement: "footer_cta" }}
            target={usesApplicationLink ? "_blank" : undefined}
            rel={usesApplicationLink ? "noreferrer" : undefined}
          >
            {usesApplicationLink ? "Apply now" : "Request an invite"}
          </TrackedActionLink>
        </section>

        <footer className="affiliate-footer">
          <a href="/">TradeOps</a>
          <span>Market commentary only. Not financial advice.</span>
          <a href="mailto:masingdesign@gmail.com">Contact</a>
        </footer>
      </main>
    </AttributionPage>
  );
}
