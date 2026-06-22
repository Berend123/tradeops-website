import { cookies } from "next/headers";
import Image from "next/image";
import { AttributionPage } from "./components/attribution-page";
import CheckoutButton from "./components/checkout-button";
import TrackedActionLink from "./components/tracked-action-link";
import { DISCORD_SESSION_COOKIE, parseDiscordSession } from "../lib/discord-oauth";
import { getTradeOpsContent } from "../lib/tradeops-data";

const faqItems = [
  {
    question: "Who is TradeOps built for?",
    answer:
      "TradeOps is for active traders who want a faster morning process and a cleaner premarket briefing across stocks and crypto.",
  },
  {
    question: "Is this a buy or sell signal service?",
    answer:
      "No. TradeOps is a Morning Edge briefing product. It gives members market weather, a trade read, best long and short, priority tiers, and risk framing so they can decide what deserves attention.",
  },
  {
    question: "What do members actually receive?",
    answer:
      "Members receive a Morning Edge dashboard plus Discord Pro access with market regime context, named catalysts, a best long, a best short, a priority board, market confirmation notes, and clear confirmation and invalidation language.",
  },
  {
    question: "Does it cover crypto as well as stocks?",
    answer:
      "Yes. TradeOps is built as a cross-market product so traders can see both stock and crypto context in one morning operating brief.",
  },
];

const audience = [
  "Discord trading communities",
  "Active retail traders",
  "Stock and crypto traders",
  "Market scanners",
  "Newsletter operators",
  "Trading educators",
];

const comparisonRows = [
  ["Dumps headlines", "Starts with market weather and a trade read"],
  ["Flat watchlist", "Best long, best short, and priority tiers"],
  ["Requires manual sorting", "Ranks focus before the open"],
  ["Mostly reactive", "Highlights named catalysts"],
  ["No hierarchy", "Includes confirmation, invalidation, and avoid notes"],
];

const pricingTiers = [
  {
    name: "Pro",
    accessLabel: "Launch Access",
    price: "$29/mo",
    description: "The launch offer for the core TradeOps Morning Edge dashboard and Discord Pro access.",
    features: [
      "Hosted Morning Edge dashboard",
      "Best long and best short",
      "Priority 1 / 2 / 3 board",
      "Market confirmation and avoid notes",
      "Discord member access",
    ],
    accent: "primary",
  },
];

const heroParticles = [
  { left: "8%", top: "10%", size: "10px", delay: "0s", duration: "9.5s" },
  { left: "16%", top: "34%", size: "8px", delay: "0.9s", duration: "7.2s" },
  { left: "28%", top: "18%", size: "14px", delay: "1.4s", duration: "10.5s" },
  { left: "41%", top: "8%", size: "6px", delay: "2.1s", duration: "8.1s" },
  { left: "57%", top: "26%", size: "12px", delay: "0.4s", duration: "9.1s" },
  { left: "66%", top: "12%", size: "8px", delay: "1.8s", duration: "11s" },
  { left: "78%", top: "32%", size: "10px", delay: "2.4s", duration: "8.8s" },
  { left: "88%", top: "16%", size: "7px", delay: "1.1s", duration: "10.3s" },
];

function getLineTone(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return "brief-line-empty";
  }
  if (trimmed.startsWith("#")) {
    return "brief-line-heading";
  }
  if (
    /^(Catalyst:|Conviction:|Risk:|Confirmation:|Invalidation:|Priority \d:|Stocks:|Crypto:)/.test(trimmed)
  ) {
    return "brief-line-signal";
  }
  if (trimmed.startsWith("-")) {
    return "brief-line-note";
  }
  if (!line.trim()) {
    return "brief-line-empty";
  }
  return "";
}

function BriefLines({ markdown }) {
  const lines = markdown.split("\n");

  return (
    <ol className="brief-lines" aria-label="TradeOps sample brief">
      {lines.map((line, index) => (
        <li
          key={`brief-line-${index}`}
          className={`${getLineTone(line)}${line.trim() ? "" : " is-empty"}`}
        >
          <span>{line || " "}</span>
        </li>
      ))}
    </ol>
  );
}

function WatchlistCard({ title, description, rows, tone = "up", chip = "" }) {
  const visibleRows = rows.length
    ? rows
    : [
        {
          ticker: "STBY",
          meta: "Monitor only",
          headline: "Fresh catalysts populate here as the daily brief updates.",
        },
      ];

  return (
    <article className={`watchlist-card watchlist-card-${tone}`}>
      <div className="watchlist-card-head">
        <div className="eyebrow">{title}</div>
        <span className="watchlist-chip">{chip || (tone === "down" ? "Headline short" : "Headline long")}</span>
      </div>
      <p>{description}</p>
      <div className="ticker-list">
        {visibleRows.map((row) => (
          <div key={`${title}-${row.ticker}`} className="ticker-row">
            <div>
              <strong>{row.ticker}</strong>
              <span>{row.meta}</span>
            </div>
            <p>{row.headline}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SignalLane({ title, tone, summary, rows, pillLabel }) {
  return (
    <article className={`signal-lane signal-lane-${tone}`}>
      <div className="lane-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>{summary}</h3>
        </div>
        <span className={`lane-pill lane-pill-${tone}`}>{pillLabel}</span>
      </div>
      <div className="lane-list">
        {rows.map((row) => (
          <div key={`${title}-${row.ticker}`} className="signal-row" tabIndex={0}>
            <div className="signal-ticker-stack">
              <strong>{row.ticker}</strong>
              <span>{row.meta}</span>
            </div>
            <p>{row.headline}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function buildDiscordConnectHref() {
  return "/api/discord/oauth/start?return_to=%2F&redirect=%2Fdashboard";
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const discordSession = parseDiscordSession(cookieStore.get(DISCORD_SESSION_COOKIE)?.value || "");
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/ZMuqZmN2qy";
  const connectHref = buildDiscordConnectHref();
  const connectedDiscordLabel = discordSession?.globalName || discordSession?.username || discordSession?.userId || "";
  const { markdown, noiseStream, sampleCards, signalPanels, structureSummary } = getTradeOpsContent();

  const signalMetrics = [
    { label: "Brief Format", value: "Morning Edge", note: "Illustrative Discord format" },
    { label: "Priority Tiers", value: "3", note: "P1, P2, and P3 hierarchy" },
    { label: "Headline Setups", value: "Long + Short", note: "Best setup on each side" },
    { label: "Decision Time", value: "< 5 min", note: "Built for the morning process" },
  ];

  const heroSignals = signalPanels
    .flatMap((lane) =>
      lane.rows.slice(0, 1).map((row) => ({
        lane: lane.title,
        ticker: row.ticker,
        meta: row.meta.toUpperCase(),
      })),
    )
    .slice(0, 4);

  return (
    <AttributionPage pageType="home">
      <main className="page-shell">
      <div className="background-grid" />

      <section className="hero">
        <div className="hero-particles" aria-hidden="true">
          {heroParticles.map((particle, index) => (
            <span
              key={`particle-${index}`}
              className="hero-particle"
              style={{
                "--left": particle.left,
                "--top": particle.top,
                "--size": particle.size,
                "--delay": particle.delay,
                "--duration": particle.duration,
              }}
            />
          ))}
        </div>

        <div className="hero-frame">
          <div className="hero-intro">
            <div className="hero-kicker">
              <span className="signal-beam" />
              <span className="eyebrow">Market Operations Center</span>
            </div>

            <div className="hero-actions">
              <a className="button button-primary" href="#pricing">
                Start TradeOps Pro
              </a>
              <TrackedActionLink className="button button-secondary" href="/login">
                Member Login
              </TrackedActionLink>
              <a className="button button-secondary" href="#sample-brief">
                See Sample Brief
              </a>
            </div>

            <div className="hero-logo-shell">
              <Image
                src="/TradeOpsLogoTransparent.png"
                alt="TradeOps"
                fill
                priority
                sizes="(max-width: 768px) 92vw, 720px"
                className="hero-logo-image"
              />
            </div>

            <div className="hero-copy">
              <h1>Signal. Not Noise.</h1>
              <p className="lede">
                TradeOps turns stock and crypto catalysts into a Morning Edge briefing with market
                weather, a trade read, best long, best short, priority tiers, and confirmation notes
                for active traders.
              </p>
              <p className="hero-note">Public site preview only. This page shows an illustrative briefing, not a live feed.</p>
            </div>
          </div>

          <div className="hero-deck">
            <div className="hero-metrics">
              {signalMetrics.map((metric) => (
                <div key={metric.label} className="metric-tile">
                  <span className="metric-label">{metric.label}</span>
                  <strong className="metric-value">{metric.value}</strong>
                  <span className="metric-note">{metric.note}</span>
                </div>
              ))}
            </div>

            <aside className="hero-terminal" aria-label="Market scan terminal preview">
              <div className="terminal-head">
                <div className="terminal-head-left">
                  <span className="terminal-dot" />
                  <span>Example Scan</span>
                </div>
                <span>Preview Engine</span>
              </div>

              <div className="terminal-body">
                <div className="terminal-line terminal-line-command" style={{ "--line-delay": "0.12s" }}>
                  [ SCANNING MARKET ]
                </div>
                {heroSignals.map((item, index) => {
                  const text = `+ ${item.ticker} / ${item.meta}`;
                  return (
                    <div
                      key={`terminal-${item.lane}-${item.ticker}`}
                      className="terminal-line terminal-line-signal"
                      style={{ "--line-delay": `${0.34 + index * 0.16}s` }}
                    >
                      <span className="terminal-prefix">{item.lane}</span>
                      {text}
                    </div>
                  );
                })}
                <div className="terminal-line terminal-line-status" style={{ "--line-delay": "1.05s" }}>
                  SAMPLE WATCHLIST GENERATED
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="operations-section">
        <div className="section-heading">
          <span className="eyebrow">Operating Board</span>
          <h2>One briefing. Clear hierarchy.</h2>
          <p>
            TradeOps is built like a morning operations center: set the environment first, rank the
            top setups, and make it obvious what deserves immediate attention versus confirmation only.
          </p>
        </div>

        <div className="signal-board">
          {signalPanels.map((lane) => (
            <SignalLane key={lane.title} {...lane} />
          ))}
        </div>
      </section>

      <section id="sample-brief" className="sample-block">
        <div className="section-heading">
          <span className="eyebrow">Sample Output</span>
          <h2>This is what members actually receive in Discord.</h2>
          <p>
            A clean Morning Edge briefing with market weather, market regime, a trade read, best long,
            best short, priority tiers, market confirmation, and risk framing. No data dump. No noise.
          </p>
        </div>

        <div className="sample-layout">
          <div className="discord-shell">
            <div className="discord-topline">
              <div className="discord-topline-left">
                <span className="channel-dot" />
                <strong>Sample Discord Output</strong>
              </div>
              <span>Illustrative Brief</span>
            </div>

            <div className="discord-metadata">
              <span>tradeops-morning-edge</span>
              <span>Cross-market example</span>
              <span>Embed-first briefing preview</span>
            </div>

            <BriefLines markdown={markdown} />
          </div>

          <div className="sample-side">
            <div className="insight-card">
              <span className="eyebrow">What it solves</span>
              <h3>Start with a clearer morning board.</h3>
              <p>
                Use TradeOps before the session to understand the environment, identify the best long
                and short, and rank what is actually worth your attention.
              </p>
            </div>

            <div className="insight-card">
              <span className="eyebrow">What it avoids</span>
              <h3>Less scrolling, less sorting, less fake urgency.</h3>
              <p>
                TradeOps is built to stop every ticker from looking equally important. The value is the
                hierarchy, not just the headline feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="problem-grid">
        <div className="section-heading">
          <span className="eyebrow">Chaos To Structure</span>
          <h2>Markets are noisy. Your morning brief should not be.</h2>
          <p>
            TradeOps filters an unstructured headline flood into a ranked operating brief that can
            actually drive the morning process.
          </p>
        </div>

        <div className="problem-stage">
          <article className="noise-panel">
            <div className="panel-strip">
              <span>Noise Feed</span>
              <span>Unfiltered tape</span>
            </div>

            <div className="noise-list">
              {noiseStream.map((item, index) => (
                <div key={`noise-${item.stream}-${item.ticker}-${index}`} className="noise-item">
                  <div className="noise-meta">
                    <span>{item.tag}</span>
                    <strong>{item.ticker}</strong>
                  </div>
                  <p>{item.headline}</p>
                  <small>{item.stream}</small>
                </div>
              ))}
            </div>
          </article>

          <div className="problem-beam" aria-hidden="true">
            <span className="problem-beam-label">FILTER</span>
          </div>

          <article className="structure-panel">
            <div className="panel-strip">
              <span>TradeOps Brief</span>
              <span>Structured output</span>
            </div>

            <div className="structure-summary">
              {structureSummary.map((item) => (
                <div key={item.title} className="structure-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.tickers || "Standby"}</span>
                  </div>
                  <p>Focused section with clearer hierarchy, named catalysts, and cleaner execution context.</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="problem-copy">
          <p>
            Every day traders face headlines, earnings reactions, crypto updates, lawsuits, upgrades,
            downgrades, ETF news, listings, and endless ticker chatter. Most of it arrives with no
            built-in hierarchy.
          </p>
          <p>
            TradeOps filters that chaos into a short morning brief where the environment, the top
            setups, and the confirmation layer are already separated for you.
          </p>
        </div>
      </section>

      <section className="cards-section">
        <div className="section-heading">
          <span className="eyebrow">What members get</span>
          <h2>A briefing structure built for trader decisions.</h2>
          <p>
            The product is built around hierarchy. Members get event-backed setups, ranked focus, and
            trader-ready framing inside Discord.
          </p>
        </div>

        <div className="cards-grid">
          {sampleCards.map((card) => (
            <WatchlistCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <span className="eyebrow">Workflow</span>
          <h2>From raw catalysts to a repeatable morning brief.</h2>
          <p>TradeOps is designed to organize chaos into the same briefing loop members can learn every morning.</p>
        </div>

        <div className="workflow-grid">
          <article>
            <span>01</span>
            <h3>Scan</h3>
            <p>TradeOps monitors fresh stock and crypto catalysts across the market.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Structure</h3>
            <p>It separates the environment, the top setups, the priority board, and the confirmation layer.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Brief</h3>
            <p>It turns the board into a clean Discord-ready Morning Edge briefing.</p>
          </article>
        </div>
      </section>

      <section className="comparison-section">
        <div className="section-heading">
          <span className="eyebrow">Positioning</span>
          <h2>Not another news feed.</h2>
          <p>TradeOps exists to narrow attention, not widen it. The advantage is the operating hierarchy.</p>
        </div>

        <div className="comparison-table">
          <div className="comparison-head">
            <strong>News Feed</strong>
            <strong>TradeOps</strong>
          </div>
          {comparisonRows.map(([left, right]) => (
            <div key={left} className="comparison-row">
              <span>{left}</span>
              <span>{right}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="audience-section">
        <div className="section-heading">
          <span className="eyebrow">Use cases</span>
          <h2>Built for active traders who need a sharper morning process.</h2>
          <p>
            Use TradeOps before the session to understand the tape, build your screen, prepare alerts,
            and avoid spending the first hour ranking everything manually.
          </p>
        </div>

        <div className="audience-grid">
          {audience.map((item) => (
            <div key={item} className="audience-chip">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-heading">
          <span className="eyebrow">Launch Offer</span>
          <h2>TradeOps Pro is $29 per month.</h2>
          <p>
            One clear offer for launch. Join the Discord, get the Morning Edge briefing, and keep your
            morning process focused.
          </p>
        </div>

        <div className="pricing-grid pricing-grid-single">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`pricing-card ${tier.accent === "primary" ? "pricing-card-primary" : ""}`}
            >
              <div className="pricing-card-head">
                <span className="pricing-access">{tier.accessLabel}</span>
                <div>
                  <span className="eyebrow">{tier.name}</span>
                  <h3>{tier.price}</h3>
                  <p>{tier.description}</p>
                </div>
              </div>
              <ul>
                {tier.features.map((feature) => (
                  <li key={`${tier.name}-${feature}`}>{feature}</li>
                ))}
              </ul>
              {discordSession ? (
                <div className="join-status-pill join-status-pill-confirmed">
                  Discord connected: {connectedDiscordLabel}. Checkout can link the dashboard and Discord Pro access faster.
                </div>
              ) : (
                <div className="join-status-pill">
                  Connecting Discord before checkout is recommended, but not required. You can still claim access on the join page after payment.
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
                  metadata={{ destination: "discord_oauth_connect", page_type: "home" }}
                >
                  {discordSession ? "Reconnect Discord" : "Connect Discord Now"}
                </TrackedActionLink>
                <TrackedActionLink
                  className="button button-secondary"
                  href={discordUrl}
                  eventType="discord_button_click"
                  metadata={{ destination: "discord_join", page_type: "home" }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join the Discord First
                </TrackedActionLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2>What traders usually want to know.</h2>
        </div>

        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="final-cta" className="final-cta">
        <div>
          <span className="eyebrow">Final CTA</span>
          <h2>Start each session with a brief you can actually use.</h2>
          <p>
            TradeOps is built to help traders cut through noise and focus on the few stock and crypto
            names that actually deserve attention this morning.
          </p>
        </div>
        <div className="cta-actions">
          <a className="button button-primary" href="#pricing">
            Start TradeOps Pro
          </a>
          <TrackedActionLink className="button button-secondary" href="/login">
            Member Login
          </TrackedActionLink>
          <a className="button button-secondary" href="#sample-brief">
            See Sample Brief
          </a>
        </div>
      </section>
      </main>
    </AttributionPage>
  );
}
