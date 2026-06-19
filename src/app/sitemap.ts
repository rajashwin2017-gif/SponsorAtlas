import type { MetadataRoute } from "next";
import { SPONSORS } from "@/lib/mock-data";

const BASE = "https://sponsoratlas.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/search", "/soc-codes", "/pricing", "/dashboard"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const sponsorRoutes = SPONSORS.map((s) => ({
    url: `${BASE}/sponsors/${s.id}`,
    lastModified: new Date(s.lastUpdated),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...sponsorRoutes];
}
