import "./globals.css";

export const metadata = {
  title: "TradeOps | Daily Market Focus Engine",
  description:
    "TradeOps scans stocks and crypto, finds the strongest developing bullish and bearish catalysts, and turns them into a daily trader watchlist.",
  icons: {
    icon: "/favicon-transparent.png",
    shortcut: "/favicon-transparent.png",
    apple: "/favicon-transparent.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
