import { NextResponse } from "next/server";
import { searchSponsors, type SortKey } from "@/lib/mock-data";

/**
 * GET /api/sponsors
 * Query params: q, industry (repeatable), city (repeatable), route (repeatable),
 *   aRated=1, minCos, band (repeatable), sort, page, pageSize
 *
 * Backed by mock data. In production this queries Postgres with pg_trgm fuzzy
 * search and returns the same shape.
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
    aRatedOnly: searchParams.get("aRated") === "1",
    minCos: Number(searchParams.get("minCos") ?? 0),
    hiringBands: searchParams.getAll("band"),
    sort: (searchParams.get("sort") as SortKey) ?? "relevance",
  });

  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);

  return NextResponse.json({
    data,
    pagination: { page, pageSize, total: all.length, totalPages: Math.ceil(all.length / pageSize) },
  });
}
