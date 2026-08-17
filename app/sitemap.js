const publicRoutes = ["", "/pricing", "/join", "/affiliates", "/hendrik-fuchs"];

export default function sitemap() {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `https://tradeops.org${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/hendrik-fuchs" ? 0.8 : 0.7,
  }));
}
