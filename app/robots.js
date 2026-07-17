export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account", "/dashboard", "/login", "/discord/"],
    },
    sitemap: "https://tradeops.org/sitemap.xml",
    host: "https://tradeops.org",
  };
}
