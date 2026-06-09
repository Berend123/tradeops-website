import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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
      <body className={`${displayFont.variable} ${monoFont.variable}`}>{children}</body>
    </html>
  );
}
