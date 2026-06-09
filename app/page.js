import Image from "next/image";
import { getTradeOpsContent } from "../lib/tradeops-data";

const faqItems = [
  {
    question: "Who is TradeOps built for?",
    answer:
      "TradeOps is for active traders who want a faster morning process and a cleaner watchlist across stocks and crypto.",
  },
  {
    question: "Is this a buy or sell signal service?",
    answer:
      "No. TradeOps is a market focus product. It gives members names, context, triggers, and risk framing so they can decide what deserves attention.",
  },
  {
    question: "What do members actually receive?",
    answer:
      "Members receive a daily cross-market watchlist with bullish stocks, bearish stocks, bullish crypto, bearish crypto, and plain-English thesis, trigger, and risk framing.",
  },
  {
    question: "Does it cover crypto as well as stocks?",
    answer:
      "Yes. TradeOps is built as a cross-market product so traders can see both stock and crypto focus names in one place.",
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
  ["Dumps headlines", "Filters for relevance"],
  ["Shows everything", "Shows what matters"],
  ["Requires manual sorting", "Gives ranked focus"],
  ["Mostly reactive", "Highlights developing catalysts"],
  ["No trade framing", "Includes thesis, trigger, and risk"],
];

const pricingTiers = [
  {
    name: "Free",
    accessLabel: "Public Access",
    price: "Free",
    description: "A low-friction way to see what TradeOps looks like in the wild.",
    features: ["Occasional public examples", "Weekly sample watchlist"],
    accent: "muted",
  },
  {
    name: "Pro",
    accessLabel: "Operator Access",
    price: "$29/mo",
    description: "The core daily product for traders who want cleaner focus before the session.",
    features: [
      "Daily TradeOps watchlist",
      "Stocks long and short",
      "Crypto long and short",
      "Thesis, trigger, and risk",
      "Discord access",
    ],
    accent: "primary",
  },
  {
    name: "Elite",
    accessLabel: "Elite Desk",
    price: "$79/mo",
    description: "A higher-touch tier for members who want more updates and more structure.",
    features: [
      "Intraday updates",
      "Watchlist archive",
      "Higher-conviction alerts",
      "Weekly recap",
      "Performance tracking",
    ],
    accent: "muted",
  },
];

const footerLinks = {
  product: [
    { label: "Sample Watchlist", href: "#sample-watchlist" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  market: [
    { label: "Bullish Stocks", href: "#sample-watchlist" },
    { label: "Bearish Stocks", href: "#sample-watchlist" },
    { label: "Bullish Crypto", href: "#sample-watchlist" },
    { label: "Bearish Crypto", href: "#sample-watchlist" },
  ],
};

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

function buildLaneRows(items, fallbackHeadline) {
  const rows = items.slice(0, 3).map((item) => ({
    ticker: item.ticker,
    conviction: item.conviction,
    headline: item.headlines?.[0]?.title || fallbackHeadline,
  }));

  if (rows.length) {
    return rows;
  }

  return [
    {
      ticker: "STBY",
      conviction: "Standby",
      headline: fallbackHeadline,
    },
  ];
}

function flattenRowsForNoise(sampleCards) {
  const rows = sampleCards.flatMap((card) =>
    card.rows.map((row, index) => ({
      ticker: row.ticker,
      conviction: row.conviction,
      headline: row.headline,
      stream: card.title,
      tag: index % 3 === 0 ? "Breaking" : index % 3 === 1 ? "Flow" : "Alert",
    })),
  );

  if (rows.length) {
    return rows;
  }

  return [
    {
      ticker: "NVDA",
      conviction: "High",
      headline: "Headline pressure floods the tape before the open.",
      stream: "Noise Feed",
      tag: "Breaking",
    },
    {
      ticker: "BTC",
      conviction: "Medium",
      headline: "Cross-market volatility creates conflicting attention.",
      stream: "Noise Feed",
      tag: "Flow",
    },
  ];
}

function getToneFromTitle(title) {
  return title.toLowerCase().includes("bearish") ? "down" : "up";
}

function getLineTone(line) {
  if (!line.trim()) {
    return "brief-line-empty";
  }
  if (line.startsWith("#")) {
    return "brief-line-heading";
  }
  if (line.includes("Conviction:")) {
    return "brief-line-signal";
  }
  if (line.trim().startsWith("-")) {
    return "brief-line-note";
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

function WatchlistCard({ title, description, rows }) {
  const tone = getToneFromTitle(title);
  const visibleRows = rows.length
    ? rows
    : [
        {
          ticker: "STBY",
          conviction: "Standby",
          headline: "Fresh catalysts populate here as the daily brief updates.",
        },
      ];

  return (
    <article className={`watchlist-card watchlist-card-${tone}`}>
      <div className="watchlist-card-head">
        <div className="eyebrow">{title}</div>
        <span className="watchlist-chip">{tone === "up" ? "Long Flow" : "Short Flow"}</span>
      </div>
      <p>{description}</p>
      <div className="ticker-list">
        {visibleRows.map((row) => (
          <div key={`${title}-${row.ticker}`} className="ticker-row">
            <div>
              <strong>{row.ticker}</strong>
              <span>{row.conviction} conviction</span>
            </div>
            <p>{row.headline}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SignalLane({ title, tone, summary, rows }) {
  return (
    <article className={`signal-lane signal-lane-${tone}`}>
      <div className="lane-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>{summary}</h3>
        </div>
        <span className={`lane-pill lane-pill-${tone}`}>{tone === "up" ? "Active Longs" : "Pressure Shorts"}</span>
      </div>
      <div className="lane-list">
        {rows.map((row) => (
          <div key={`${title}-${row.ticker}`} className="signal-row" tabIndex={0}>
            <div className="signal-ticker-stack">
              <strong>{row.ticker}</strong>
              <span>{row.conviction}</span>
            </div>
            <p>{row.headline}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function HomePage() {
  const { markdown, sampleCards, stockBySide, cryptoBySide } = getTradeOpsContent();
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "#final-cta";
  const discordLinkProps = discordUrl.startsWith("http")
    ? { href: discordUrl, target: "_blank", rel: "noreferrer" }
    : { href: discordUrl };

  const signalMetrics = [
    { label: "Symbols Scanned", value: "8,000+", note: "Illustrative product capability" },
    { label: "Signal Lanes", value: "4", note: "Stocks and crypto, long and short" },
    { label: "Decision Time", value: "< 5 min", note: "Built for the morning process" },
    { label: "Output", value: "Daily Brief", note: "Example Discord format" },
  ];

  const signalLanes = [
    {
      title: "Stocks Long",
      tone: "up",
      summary: "Relative strength lanes with upside catalysts and momentum follow-through.",
      rows: buildLaneRows(stockBySide.long, "Fresh upside catalyst is building into the session."),
    },
    {
      title: "Stocks Short",
      tone: "down",
      summary: "Weakness lanes where failed rebounds and negative catalysts matter most.",
      rows: buildLaneRows(stockBySide.short, "Fresh downside pressure is setting up on the tape."),
    },
    {
      title: "Crypto Long",
      tone: "up",
      summary: "Participation lanes showing constructive flow, continuation, and broad support.",
      rows: buildLaneRows(cryptoBySide.long, "Fresh upside participation is setting up in crypto."),
    },
    {
      title: "Crypto Short",
      tone: "down",
      summary: "Pressure lanes highlighting failed bounces and heavy beta exposure.",
      rows: buildLaneRows(cryptoBySide.short, "Fresh pressure is widening across crypto majors."),
    },
  ];

  const heroSignals = signalLanes
    .flatMap((lane) =>
      lane.rows.slice(0, 1).map((row) => ({
        lane: lane.title,
        ticker: row.ticker,
        conviction: row.conviction.toUpperCase(),
      })),
    )
    .slice(0, 4);

  const noiseStream = flattenRowsForNoise(sampleCards).slice(0, 8);

  const structureSummary = signalLanes.map((lane) => ({
    title: lane.title,
    tickers: lane.rows
      .slice(0, 2)
      .map((row) => row.ticker)
      .join(" / "),
  }));

  return (
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

            <p className="hero-tag">Illustrative product preview</p>
            <h1>Signal. Not Noise.</h1>
            <p className="lede">
              TradeOps is designed to scan stock and crypto news, detect meaningful catalysts, and
              turn the chaos into a structured long and short operating board for active traders.
            </p>
            <p className="hero-note">Public site preview only. This page shows examples, not a live feed.</p>

            <div className="hero-actions">
              <a className="button button-primary" {...discordLinkProps}>
                Join the Discord
              </a>
              <a className="button button-secondary" href="#sample-watchlist">
                See Sample Watchlist
              </a>
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
                  const text = `+ ${item.ticker} / ${item.conviction} CONVICTION`;
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
          <h2>Four signal lanes. One structured decision board.</h2>
          <p>
            TradeOps is built like a morning operations center: separate the tape into actionable
            lanes, rank conviction, and move from reaction to preparation.
          </p>
        </div>

        <div className="signal-board">
          {signalLanes.map((lane) => (
            <SignalLane key={lane.title} {...lane} />
          ))}
        </div>
      </section>

      <section id="sample-watchlist" className="sample-block">
        <div className="section-heading">
          <span className="eyebrow">Sample Output</span>
          <h2>This is what members actually receive.</h2>
          <p>
            A clean cross-market brief with long-side and short-side names, conviction, thesis,
            trigger, and risk. No data dump. No noise.
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
              <span>tradeops-sample-watchlist</span>
              <span>Cross-market example</span>
              <span>Preview format</span>
            </div>

            <BriefLines markdown={markdown} />
          </div>

          <div className="sample-side">
            <div className="insight-card">
              <span className="eyebrow">What it solves</span>
              <h3>Start with a sharper screen list.</h3>
              <p>
                Use TradeOps before the session to decide which names deserve alerts, which ones are
                building pressure, and which ideas are worth watching on the long side or short side.
              </p>
            </div>

            <div className="insight-card">
              <span className="eyebrow">What it avoids</span>
              <h3>Less scrolling, less sorting, less guessing.</h3>
              <p>
                The product is built to narrow attention, not widen it. The value is the filter, not
                the noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="problem-grid">
        <div className="section-heading">
          <span className="eyebrow">Chaos To Structure</span>
          <h2>Markets are noisy. Your watchlist should not be.</h2>
          <p>
            TradeOps filters an unstructured headline flood into a smaller, cleaner set of
            directional signals that can actually drive the morning process.
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
                  <p>Focused lane with ranked conviction and cleaner execution context.</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="problem-copy">
          <p>
            Every day traders face headlines, earnings reactions, crypto updates, lawsuits, upgrades,
            downgrades, ETF news, listings, and endless ticker chatter. Most of it is noise.
          </p>
          <p>
            TradeOps filters that chaos into a short list of names where something meaningful may be
            developing right now.
          </p>
        </div>
      </section>

      <section className="cards-section">
        <div className="section-heading">
          <span className="eyebrow">What members get</span>
          <h2>A daily focus system for stocks and crypto.</h2>
          <p>
            The product is built around outcomes. Members get names, direction, conviction, and
            trader-ready framing.
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
          <h2>From market noise to trader-ready focus.</h2>
          <p>TradeOps is designed to organize chaos into a repeatable briefing loop before the session.</p>
        </div>

        <div className="workflow-grid">
          <article>
            <span>01</span>
            <h3>Scan</h3>
            <p>TradeOps monitors fresh stock and crypto news across the market.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Rank</h3>
            <p>It surfaces names where developing catalysts appear strong enough to matter now.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Brief</h3>
            <p>It turns the best long-side and short-side ideas into a clean Discord-ready post.</p>
          </article>
        </div>
      </section>

      <section className="comparison-section">
        <div className="section-heading">
          <span className="eyebrow">Positioning</span>
          <h2>Not another news feed.</h2>
          <p>TradeOps exists to narrow attention, not widen it. The advantage is the operating filter.</p>
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
            Use TradeOps before the session to build your screen, prepare alerts, and understand
            where fresh pressure is building.
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
          <span className="eyebrow">Access Levels</span>
          <h2>Choose your access level.</h2>
          <p>
            Start with a clear ladder. Keep the offer clean. Let the daily brief and sample output do
            the heavy lifting.
          </p>
        </div>

        <div className="pricing-grid">
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
          <h2>Turn the market into a watchlist you can actually use.</h2>
          <p>
            TradeOps is built to help traders cut through noise and focus on the few stock and crypto
            names that may actually matter today.
          </p>
        </div>
        <div className="cta-actions">
          <a className="button button-primary" {...discordLinkProps}>
            Join the Discord
          </a>
          <a className="button button-secondary" href="#sample-watchlist">
            See Sample Watchlist
          </a>
        </div>
      </section>

      <footer className="footer-shell">
        <div className="footer-watermark" aria-hidden="true">
          TRADEOPS
        </div>

        <div className="footer-brand">
          <div className="brand-lockup">
            <Image
              src="/favicon-transparent.png"
              alt="TradeOps"
              width={72}
              height={72}
              className="footer-mark"
            />
            <div>
              <strong>TradeOps</strong>
              <p>Daily market focus engine for stocks and crypto</p>
            </div>
          </div>
          <p>
            TradeOps helps traders cut through market noise and focus on the few names that may
            actually matter today.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Product</h3>
            <ul>
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Watchlists</h3>
            <ul>
              {footerLinks.market.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Access</h3>
            <ul>
              <li>
                <a {...discordLinkProps}>Join the Discord</a>
              </li>
              <li>
                <a href="#pricing">See pricing</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
