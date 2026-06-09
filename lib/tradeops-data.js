const SAMPLE_CONTEXT = {
  post_title: "TradeOps Example Cross-Market Watchlist",
  stocks: {
    market_type: "stocks",
    selected_names: [
      {
        side: "Long",
        ticker: "NVDA",
        conviction: "High",
        headlines: [{ title: "Illustrative semiconductor continuation setup after a strong relative-strength open." }],
      },
      {
        side: "Long",
        ticker: "PLTR",
        conviction: "Medium",
        headlines: [{ title: "Example software momentum name showing persistent trend support on pullbacks." }],
      },
      {
        side: "Long",
        ticker: "META",
        conviction: "Low",
        headlines: [{ title: "Illustrative large-cap follow-through candidate if risk appetite stays constructive." }],
      },
      {
        side: "Short",
        ticker: "BA",
        conviction: "Medium",
        headlines: [{ title: "Example weak-rebound short where overhead supply keeps the tape heavy." }],
      },
      {
        side: "Short",
        ticker: "SNAP",
        conviction: "Low",
        headlines: [{ title: "Illustrative failed-bounce setup with weak advertising sentiment pressure." }],
      },
      {
        side: "Short",
        ticker: "NIO",
        conviction: "Low",
        headlines: [{ title: "Example high-beta name vulnerable to further downside if buyers do not defend support." }],
      },
    ],
  },
  crypto: {
    market_type: "crypto",
    selected_names: [
      {
        side: "Long",
        ticker: "ETH",
        conviction: "Medium",
        headlines: [{ title: "Illustrative core-upside crypto setup with constructive participation on strength." }],
      },
      {
        side: "Long",
        ticker: "SOL",
        conviction: "Low",
        headlines: [{ title: "Example momentum continuation candidate if speculative flows stay active." }],
      },
      {
        side: "Short",
        ticker: "BTC",
        conviction: "Medium",
        headlines: [{ title: "Illustrative failed-bounce downside setup if broader risk appetite softens." }],
      },
      {
        side: "Short",
        ticker: "DOGE",
        conviction: "Low",
        headlines: [{ title: "Example high-volatility short lane if meme-beta momentum rolls over." }],
      },
    ],
  },
};

const SAMPLE_MARKDOWN = `# TradeOps Example Cross-Market Watchlist
Session: Illustrative Example

## Stocks
### Long Watchlist
1. NVDA | Conviction: High
   Thesis: Example semiconductor leadership setup if buyers keep defending early strength.
   Trigger: Hold above the opening range and continue after a controlled pullback.
   Risk: Failed continuation that loses the intraday trend.

2. PLTR | Conviction: Medium
   Thesis: Example software momentum name if trend-following flows stay constructive.
   Trigger: Clean reclaim of resistance and stable follow-through on volume.
   Risk: Quick rejection back into the prior range.

3. META | Conviction: Low
   Thesis: Illustrative large-cap continuation candidate if broad market tone remains supportive.
   Trigger: Acceptance above the open and steady higher lows.
   Risk: Relative weakness versus the broader tech complex.

### Short Watchlist
1. BA | Conviction: Medium
   Thesis: Example weak-rebound short if sellers remain in control near overhead supply.
   Trigger: Failed pop into resistance followed by pressure back through support.
   Risk: Squeeze if resistance breaks cleanly and holds.

2. SNAP | Conviction: Low
   Thesis: Illustrative downside setup if momentum fades after an unstable bounce.
   Trigger: Rejection around the opening range high with weak follow-through.
   Risk: Recovery bid that reclaims the prior breakdown zone.

3. NIO | Conviction: Low
   Thesis: Example high-beta laggard vulnerable to further selling if support fails.
   Trigger: Break below local support without a meaningful bounce.
   Risk: Fast reversal if buyers step in aggressively.

## Crypto
### Long Watchlist
1. ETH | Conviction: Medium
   Thesis: Example constructive crypto leader if participation broadens across majors.
   Trigger: Hold above the intraday pivot and continue through nearby resistance.
   Risk: Failed breakout that rotates back into range.

2. SOL | Conviction: Low
   Thesis: Illustrative speculative upside lane if high-beta participation expands.
   Trigger: Reclaim local resistance with continuation after consolidation.
   Risk: Momentum stalls and slips back below the pivot.

### Short Watchlist
1. BTC | Conviction: Medium
   Thesis: Example downside pressure point if broader crypto sentiment weakens.
   Trigger: Failed bounce into supply or a clean support break.
   Risk: Sharp reclaim that flips near-term momentum.

2. DOGE | Conviction: Low
   Thesis: Illustrative meme-beta short if speculative appetite cools.
   Trigger: Rejection after a weak recovery attempt.
   Risk: Sudden squeeze on light positioning.

## Notes
- This website shows illustrative example watchlists, not a live feed.
- Sample format only. Wait for confirmation and manage risk.
`;

function sanitizeMarkdownForDisplay(markdown) {
  return markdown.replace(/^Date:\s+\d{4}-\d{2}-\d{2}\s*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
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
    headline: item.headlines?.[0]?.title || "Illustrative setup preview.",
  }));
}

export function getTradeOpsContent() {
  const context = SAMPLE_CONTEXT;
  const markdown = sanitizeMarkdownForDisplay(SAMPLE_MARKDOWN);

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
        description: "Illustrative long-biased stock examples with clean trader framing.",
        rows: buildSampleRows(stockBySide.long),
      },
      {
        title: "Bearish Stocks",
        description: "Illustrative short-side stock examples where weakness deserves attention.",
        rows: buildSampleRows(stockBySide.short),
      },
      {
        title: "Bullish Crypto",
        description: "Illustrative crypto names showing constructive upside participation.",
        rows: buildSampleRows(cryptoBySide.long),
      },
      {
        title: "Bearish Crypto",
        description: "Illustrative crypto downside examples where failed bounces matter.",
        rows: buildSampleRows(cryptoBySide.short),
      },
    ],
  };
}
