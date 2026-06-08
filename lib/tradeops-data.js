import fs from "node:fs";
import path from "node:path";

function fallbackContext() {
  return {
    as_of_utc: "2026-06-05T13:41:44Z",
    date_label: "2026-06-05",
    post_title: "TradeOps Cross-Market Watchlist",
    stocks: {
      market_type: "stocks",
      selected_names: [
        { side: "Long", ticker: "NVDA", conviction: "High", catalyst_hint: "other", headlines: [] },
        { side: "Short", ticker: "BA", conviction: "Medium", catalyst_hint: "other", headlines: [] },
      ],
    },
    crypto: {
      market_type: "crypto",
      selected_names: [
        { side: "Long", ticker: "ETH", conviction: "Medium", catalyst_hint: "other", headlines: [] },
        { side: "Short", ticker: "BTC", conviction: "Medium", catalyst_hint: "other", headlines: [] },
      ],
    },
  };
}

function fallbackMarkdown() {
  return `# TradeOps Cross-Market Watchlist
Session: Pre-market

## Stocks
### Long Watchlist
1. NVDA | Conviction: High
   Thesis: Fresh upside interest keeps the name on focus.
   Trigger: Strength above the early range.
   Risk: Failed follow-through.

### Short Watchlist
1. BA | Conviction: Medium
   Thesis: Fresh pressure keeps the name on weak-watch.
   Trigger: Failed rebound into resistance.
   Risk: Squeeze if resistance breaks.

## Crypto
### Long Watchlist
1. ETH | Conviction: Medium
   Thesis: Broad participation keeps ETH on upside watch.
   Trigger: Acceptance above the intraday pivot.
   Risk: Failed breakout.

### Short Watchlist
1. BTC | Conviction: Medium
   Thesis: Heavy trade keeps BTC vulnerable.
   Trigger: Break below local support.
   Risk: Sharp reclaim of resistance.
`;
}

function sanitizeMarkdownForDisplay(markdown) {
  return markdown.replace(/^Date:\s+\d{4}-\d{2}-\d{2}\s*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function splitBySide(items) {
  return {
    long: items.filter((item) => item.side === "Long"),
    short: items.filter((item) => item.side === "Short"),
  };
}

function buildSampleRows(items) {
  return items.slice(0, 3).map((item) => ({
    ticker: item.ticker,
    conviction: item.conviction,
    headline: item.headlines?.[0]?.title || "Fresh catalyst keeps this name on watch.",
  }));
}

export function getTradeOpsContent() {
  const projectRoot = path.resolve(process.cwd(), "..");
  const contextPath = path.join(
    projectRoot,
    "data",
    "processed",
    "cross_market_posts",
    "community_post_context_latest.json",
  );
  const markdownPath = path.join(
    projectRoot,
    "data",
    "processed",
    "cross_market_posts",
    "community_post_latest.md",
  );

  const context = readJsonIfExists(contextPath) || fallbackContext();
  const markdown = sanitizeMarkdownForDisplay(readTextIfExists(markdownPath) || fallbackMarkdown());

  const stockNames = context.stocks?.selected_names || [];
  const cryptoNames = context.crypto?.selected_names || [];
  const stockBySide = splitBySide(stockNames);
  const cryptoBySide = splitBySide(cryptoNames);

  return {
    context,
    markdown,
    stockBySide,
    cryptoBySide,
    sampleCards: [
      {
        title: "Bullish Stocks",
        description: "High-priority long-biased stock names with fresh pressure and clean trader framing.",
        rows: buildSampleRows(stockBySide.long),
      },
      {
        title: "Bearish Stocks",
        description: "Short-side stock setups where weakness or negative catalysts deserve attention.",
        rows: buildSampleRows(stockBySide.short),
      },
      {
        title: "Bullish Crypto",
        description: "Crypto names showing upside participation or positive catalyst flow.",
        rows: buildSampleRows(cryptoBySide.long),
      },
      {
        title: "Bearish Crypto",
        description: "Crypto assets where pressure is building and failed bounces matter.",
        rows: buildSampleRows(cryptoBySide.short),
      },
    ],
  };
}
