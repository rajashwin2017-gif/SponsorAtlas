import type { MetadataRoute } from "next";
import { getSponsors } from "@/lib/sponsor-store";

const BASE = "https://thesponsorfinder.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/search", "/soc-codes", "/pricing"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const sponsorRoutes = getSponsors().map((s) => ({
    url: `${BASE}/sponsors/${s.id}`,
    lastModified: new Date(s.lastUpdated),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...sponsorRoutes];
}
