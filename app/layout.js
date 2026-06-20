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
  title: "TradeOps | Morning Edge Market Briefing",
  description:
    "TradeOps turns stock and crypto catalysts into a Morning Edge Discord briefing with market weather, best long and short, priority tiers, and risk framing.",
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
