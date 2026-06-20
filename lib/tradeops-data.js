const SIGNAL_PANELS = [
  {
    title: "Best Long",
    tone: "up",
    pillLabel: "Headline Long",
    summary: "Named catalyst with cleaner continuation conditions and a clear invalidation.",
    rows: [
      {
        ticker: "PLTR",
        meta: "Conviction 5/5",
        headline: "Contract win keeps the long in play only if the first pullback holds.",
      },
      {
        ticker: "NVDA",
        meta: "Conviction 4/5",
        headline: "Analyst support matters only if buyers keep leadership clean after the open.",
      },
    ],
  },
  {
    title: "Best Short",
    tone: "down",
    pillLabel: "Headline Short",
    summary: "Headline risk with cleaner failed-rebound conditions and unresolved pressure.",
    rows: [
      {
        ticker: "ERAS",
        meta: "Conviction 5/5",
        headline: "Lawsuit pressure stays valid only while rebounds keep failing into resistance.",
      },
      {
        ticker: "SNOW",
        meta: "Conviction 4/5",
        headline: "Guidance damage matters only if buyers cannot repair the tape.",
      },
    ],
  },
  {
    title: "Priority Board",
    tone: "up",
    pillLabel: "P1 / P2 / P3",
    summary: "The board is tiered so not every name carries the same visual weight or urgency.",
    rows: [
      {
        ticker: "PLTR",
        meta: "Priority 1",
        headline: "Fresh contract catalyst with clean continuation conditions.",
      },
      {
        ticker: "ERAS",
        meta: "Priority 1",
        headline: "Headline-driven short with unresolved legal risk.",
      },
      {
        ticker: "NVDA",
        meta: "Priority 2",
        headline: "Leadership name worth tracking, but not the top event on the board.",
      },
    ],
  },
  {
    title: "Market Confirmation",
    tone: "neutral",
    pillLabel: "Regime Check",
    summary: "Confirmation names validate the tape. They do not always deserve the headline trade slot.",
    rows: [
      {
        ticker: "ETH",
        meta: "Confirmation",
        headline: "ETH is not the lead trade here. It confirms whether risk appetite is broad enough to matter.",
      },
      {
        ticker: "BTC",
        meta: "Context",
        headline: "If majors fail to hold, the rest of the crypto board usually gets harder to trust.",
      },
    ],
  },
];

const SAMPLE_CARDS = [
  {
    title: "Best Long",
    tone: "up",
    chip: "Event-backed long",
    description: "A named catalyst, a clear reason it matters today, and cleaner confirmation terms.",
    rows: [
      {
        ticker: "PLTR",
        meta: "Contract Win",
        headline: "Commercial momentum matters only if buyers keep defending continuation.",
      },
      {
        ticker: "NVDA",
        meta: "Analyst Upgrade",
        headline: "Leadership stays valid only if relative strength does not fade into the open.",
      },
    ],
  },
  {
    title: "Best Short",
    tone: "down",
    chip: "Event-backed short",
    description: "A real negative catalyst and a setup that still needs the market to keep pricing it as unresolved.",
    rows: [
      {
        ticker: "ERAS",
        meta: "Lawsuit",
        headline: "Legal risk matters only if sellers keep leaning on weak rebounds.",
      },
      {
        ticker: "SNOW",
        meta: "Guidance Cut",
        headline: "The short remains cleaner only while bounce attempts fail to repair the damage.",
      },
    ],
  },
  {
    title: "Priority Board",
    tone: "neutral",
    chip: "P1 / P2 / P3",
    description: "TradeOps ranks what deserves immediate attention instead of making every ticker look equal.",
    rows: [
      {
        ticker: "PLTR",
        meta: "Priority 1",
        headline: "Top long if continuation stays clean.",
      },
      {
        ticker: "ERAS",
        meta: "Priority 1",
        headline: "Top short while headline pressure remains unresolved.",
      },
      {
        ticker: "NVDA",
        meta: "Priority 2",
        headline: "Secondary leader, not the headline event.",
      },
    ],
  },
  {
    title: "Market Confirmation",
    tone: "neutral",
    chip: "Regime check",
    description: "Some names are there to validate the tape, not to force a full trade idea.",
    rows: [
      {
        ticker: "ETH",
        meta: "Confirmation",
        headline: "ETH should confirm whether crypto risk appetite is broad enough to trust.",
      },
      {
        ticker: "BTC",
        meta: "Context",
        headline: "If majors fail to confirm, lower-quality crypto setups usually get harder to trust.",
      },
    ],
  },
];

const NOISE_STREAM = [
  {
    ticker: "TSLA",
    meta: "Breaking",
    headline: "Conflicting macro chatter hits the tape before traders can rank what actually matters.",
    stream: "Noise Feed",
    tag: "Breaking",
  },
  {
    ticker: "BTC",
    meta: "Flow",
    headline: "Cross-market volatility drags attention across majors without clarifying which names deserve focus.",
    stream: "Noise Feed",
    tag: "Flow",
  },
  {
    ticker: "AAPL",
    meta: "Alert",
    headline: "Generic ticker chatter expands the screen list before any real catalyst hierarchy is built.",
    stream: "Noise Feed",
    tag: "Alert",
  },
  {
    ticker: "SOL",
    meta: "Flow",
    headline: "Crypto beta starts moving, but the tape still needs confirmation before lower-quality names matter.",
    stream: "Noise Feed",
    tag: "Flow",
  },
  {
    ticker: "BA",
    meta: "Headline",
    headline: "Fresh headlines keep printing, but without a structured brief traders still have to sort the board manually.",
    stream: "Noise Feed",
    tag: "Headline",
  },
  {
    ticker: "NVDA",
    meta: "Alert",
    headline: "Leadership names start moving while weaker side stories still compete for attention.",
    stream: "Noise Feed",
    tag: "Alert",
  },
];

const SAMPLE_MARKDOWN = `# TRADEOPS | MORNING EDGE
Session: Illustrative Example

## MARKET WEATHER
Risk-On | Selective Leadership

## MARKET REGIME
Stocks favor continuation in event-backed names.
Crypto remains neutral until majors confirm.

## TRADEOPS READ
Edge is concentrated in a few headline-driven names.
Favor confirmation over anticipation.
Failed rebounds remain the cleaner short setup.

## BEST LONG - PLTR
Catalyst: Contract Win
Conviction: 5/5
Risk: 2/5
Why it matters: A fresh commercial win gives the market a reason to keep the name in play.
Confirmation: Hold the first pullback and continue through resistance.
Invalidation: Fast rejection back into the prior range.

## BEST SHORT - ERAS
Catalyst: Lawsuit
Conviction: 5/5
Risk: 3/5
Why it matters: Legal risk keeps sellers active on rebounds while the headline remains unresolved.
Confirmation: Failed rebound into resistance with selling pressure returning.
Invalidation: Clean reclaim that holds.

## PRIORITY BOARD
Priority 1: PLTR, ERAS
Priority 2: NVDA, SNOW, COIN
Priority 3: ETH

## MARKET CONFIRMATION
Stocks: PLTR should keep leadership clean if the long side is real.
Crypto: ETH is not the headline trade today. It confirms whether risk appetite is broad enough to matter.

## AVOID
- Chasing first spikes that fail to hold.
- Treating weak bounces like resolved strength.

## REMINDER
- Watchlist only.
- Wait for confirmation.
- Manage risk.
`;

function sanitizeMarkdownForDisplay(markdown) {
  return markdown.replace(/^Date:\s+\d{4}-\d{2}-\d{2}\s*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function getTradeOpsContent() {
  const markdown = sanitizeMarkdownForDisplay(SAMPLE_MARKDOWN);
  const structureSummary = SIGNAL_PANELS.map((panel) => ({
    title: panel.title,
    tickers: panel.rows
      .slice(0, 2)
      .map((row) => row.ticker)
      .join(" / "),
  }));

  return {
    markdown,
    signalPanels: SIGNAL_PANELS,
    sampleCards: SAMPLE_CARDS,
    noiseStream: NOISE_STREAM,
    structureSummary,
  };
}
