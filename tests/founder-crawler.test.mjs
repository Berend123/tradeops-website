import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appPath = (...segments) => path.join(process.cwd(), "app", ...segments);

test("founder profile has explicit indexable metadata and server-rendered content", () => {
  const source = readFileSync(appPath("hendrik-fuchs", "page.js"), "utf8");

  assert.doesNotMatch(source, /^\s*["']use client["']/m);
  assert.match(source, /canonical:\s*["']https:\/\/tradeops\.org\/hendrik-fuchs["']/);
  assert.match(source, /robots:\s*\{[\s\S]*index:\s*true[\s\S]*follow:\s*true/);
  assert.match(source, /Hendrik Fuchs/);
  assert.match(source, /Founder of TradeOps/);
  assert.match(source, /Hunter Extensions &amp; ReconPilot/);
  assert.match(source, /Responsible Research/);
});

test("founder profile exposes important destinations through anchors", () => {
  const source = readFileSync(appPath("hendrik-fuchs", "page.js"), "utf8");
  const destinations = [
    "https://github.com/Berend123",
    "https://www.linkedin.com/in/hendrik-fuchs-1a74bba3",
    "mailto:masingdesign@gmail.com",
    "https://github.com/Berend123/BargainBahshers",
    "https://github.com/Berend123/MarineInsight",
    "https://github.com/Berend123/CoreBankingApi",
    "https://github.com/Berend123/BrowserBridge",
    "https://github.com/Berend123/hunter-reconpilot",
    "https://www.udemy.com/user/berend-fuchs/",
    "https://www.fiverr.com/s/Eg3QPA0",
  ];

  assert.match(source, /<a\b/);
  for (const destination of destinations) {
    assert.equal(source.includes(destination), true, `missing anchor destination: ${destination}`);
  }
});

test("crawler routes exist and sitemap includes the founder profile", () => {
  const robotsPath = appPath("robots.js");
  const sitemapPath = appPath("sitemap.js");

  assert.equal(existsSync(robotsPath), true);
  assert.equal(existsSync(sitemapPath), true);

  const layoutSource = readFileSync(appPath("layout.js"), "utf8");
  const robotsSource = readFileSync(robotsPath, "utf8");
  const sitemapSource = readFileSync(sitemapPath, "utf8");

  assert.match(layoutSource, /metadataBase:\s*new URL\(["']https:\/\/tradeops\.org["']\)/);
  assert.match(robotsSource, /allow:\s*["']\/["']/);
  assert.match(robotsSource, /["']\/api\/["']/);
  assert.match(robotsSource, /https:\/\/tradeops\.org\/sitemap\.xml/);
  assert.match(sitemapSource, /["']\/hendrik-fuchs["']/);
  assert.doesNotMatch(sitemapSource, /["']\/(?:api|account|dashboard|login|discord)/);
});

test("indexed homepage links directly to the founder profile", () => {
  const homeSource = readFileSync(appPath("page.js"), "utf8");

  assert.match(homeSource, /<a href=["']\/hendrik-fuchs["']>Founder Profile<\/a>/);
});
