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
    price: "Free",
    description: "A low-friction way to see what TradeOps looks like in the wild.",
    features: ["Occasional public examples", "Weekly sample watchlist"],
    accent: "muted",
  },
  {
    name: "Pro",
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

function WatchlistCard({ title, description, rows }) {
  return (
    <article className="watchlist-card">
      <div className="eyebrow">{title}</div>
      <p>{description}</p>
      <div className="ticker-list">
        {rows.map((row) => (
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

export default function HomePage() {
  const { markdown, sampleCards, stockBySide, cryptoBySide } = getTradeOpsContent();
  const heroStocks = stockBySide.long.slice(0, 2);
  const heroCrypto = cryptoBySide.long.slice(0, 2);
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "#final-cta";
  const discordLinkProps = discordUrl.startsWith("http")
    ? { href: discordUrl, target: "_blank", rel: "noreferrer" }
    : { href: discordUrl };

  return (
    <main className="page-shell">
      <div className="background-grid" />

      <section className="hero">
        <div className="hero-logo-band">
          <div className="hero-logo">
            <Image
              src="/TradeOpsLogo.png"
              alt="TradeOps"
              fill
              priority
              sizes="(max-width: 768px) 92vw, 720px"
              className="hero-logo-image"
            />
          </div>
        </div>
        <div className="hero-copy">
          <p className="lede">
            TradeOps scans fresh stock and crypto news, detects meaningful market-moving catalysts,
            and delivers focused long and short watchlists for active traders.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" {...discordLinkProps}>
              Join the Discord
            </a>
            <a className="button button-secondary" href="#sample-watchlist">
              See Sample Watchlist
            </a>
          </div>
          <div className="trustline">
            <span>Stocks long and short</span>
            <span>Crypto long and short</span>
            <span>Thesis, trigger, and risk</span>
            <span>Built for the morning process</span>
          </div>
        </div>

        <div className="hero-preview">
          <div className="hero-metrics">
            <div>
              <strong>4 lanes</strong>
              <span>Stocks long, stocks short, crypto long, crypto short</span>
            </div>
            <div>
              <strong>1 brief</strong>
              <span>One cross-market post built for trader focus</span>
            </div>
            <div>
              <strong>Daily use</strong>
              <span>Built for the morning process, not passive browsing</span>
            </div>
          </div>

          <aside className="hero-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Discord-style preview</span>
                <h2>TradeOps Daily Watchlist</h2>
              </div>
            </div>
            <div className="preview-stack">
              <div className="preview-group">
                <h3>Stocks Long</h3>
                {heroStocks.map((item) => (
                  <div key={`hero-stock-${item.ticker}`} className="preview-item">
                    <div className="preview-title">
                      <strong>{item.ticker}</strong>
                      <span>{item.conviction} conviction</span>
                    </div>
                    <p>{item.headlines?.[0]?.title || "Fresh positive catalyst."}</p>
                  </div>
                ))}
              </div>
              <div className="preview-group">
                <h3>Crypto Long</h3>
                {heroCrypto.map((item) => (
                  <div key={`hero-crypto-${item.ticker}`} className="preview-item">
                    <div className="preview-title">
                      <strong>{item.ticker}</strong>
                      <span>{item.conviction} conviction</span>
                    </div>
                    <p>{item.headlines?.[0]?.title || "Fresh upside participation."}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="sample-watchlist" className="sample-block">
        <div className="section-heading">
          <span className="eyebrow">Sample output</span>
          <h2>This is what members actually receive.</h2>
          <p>
            A clean cross-market brief with long-side and short-side names, conviction, thesis,
            trigger, and risk. No data dump. No noise.
          </p>
        </div>
        <div className="sample-layout">
          <div className="discord-shell">
            <div className="discord-topline">
              <span className="channel-dot" />
              <strong>tradeops-daily-watchlist</strong>
              <span>example brief</span>
            </div>
            <pre>{markdown}</pre>
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
          <span className="eyebrow">The problem</span>
          <h2>Markets are noisy. Your watchlist should not be.</h2>
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
          <h2>A daily focus list for stocks and crypto.</h2>
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
          <span className="eyebrow">How it works</span>
          <h2>From market noise to trader-ready focus.</h2>
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
          <span className="eyebrow">Pricing</span>
          <h2>Simple launch pricing.</h2>
          <p>Start with a clear ladder. Keep the offer clean. Let the sample output do the heavy lifting.</p>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`pricing-card ${tier.accent === "primary" ? "pricing-card-primary" : ""}`}
            >
              <div>
                <span className="eyebrow">{tier.name}</span>
                <h3>{tier.price}</h3>
                <p>{tier.description}</p>
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
        <div className="footer-brand">
          <div className="brand-lockup">
            <span className="brand-mark">TO</span>
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
