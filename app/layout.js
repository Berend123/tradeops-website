import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata = {
  metadataBase: new URL("https://tradeops.org"),
  title: "TradeOps | Morning Edge Market Briefing",
  description:
    "TradeOps turns stock and crypto catalysts into a Morning Edge dashboard and Discord Pro briefing with market weather, best long and short, priority tiers, and risk framing.",
  icons: {
    icon: "/favicon-transparent.png",
    shortcut: "/favicon-transparent.png",
    apple: "/favicon-transparent.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${monoFont.variable}`}>
        {children}
        <Script id="lemon-squeezy-affiliate-config" strategy="beforeInteractive">
          {`window.lemonSqueezyAffiliateConfig = { store: "tradeopshq" };`}
        </Script>
        <Script src="https://lmsqueezy.com/affiliate.js" strategy="afterInteractive" />
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
