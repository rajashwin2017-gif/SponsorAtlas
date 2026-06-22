import { NextResponse } from "next/server";
import {
  searchSponsors,
  getIndustryList,
  getCityList,
  getRouteList,
  type SortKey,
} from "@/lib/sponsor-store";

/**
 * GET /api/sponsors
 * Query params:
 *   q, industry (repeatable), city (repeatable), route (repeatable),
 *   tier (repeatable), activity (repeatable), aRated=1,
 *   minCos, sort, page, pageSize
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 12)));

  const all = searchSponsors({
    q: searchParams.get("q") ?? undefined,
    industries: searchParams.getAll("industry"),
    cities: searchParams.getAll("city"),
    routes: searchParams.getAll("route"),
    tiers: searchParams.getAll("tier"),
    activities: searchParams.getAll("activity"),
    aRatedOnly: searchParams.get("aRated") === "1",
    minCos: Number(searchParams.get("minCos") ?? 0),
    sort: (searchParams.get("sort") as SortKey) ?? "relevance",
  });

  const start = (page - 1) * pageSize;

  return NextResponse.json({
    data: all.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: all.length,
      totalPages: Math.ceil(all.length / pageSize),
    },
    meta: {
      industryList: getIndustryList(),
      cityList: getCityList(),
      routeList: getRouteList(),
    },
  });
}
