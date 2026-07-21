"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, SlidersHorizontal, X, ChevronDown, MapPin, Sparkles, SearchX,
  Download, Lock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorCard } from "@/components/sponsor-card";
import { useToast } from "@/components/ui/toast";
import { useTier } from "@/hooks/use-tier";
import { BlurGate } from "@/components/tier-gate";
import { cn } from "@/lib/utils";
import type { Sponsor } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;
// Auto-load this many pages on scroll, then require an explicit "Load more"
// click. Stops the results column from growing forever so the footer stays
// reachable (avoids the infinite-scroll footer dead zone).
const AUTO_LOAD_PAGES = 5;

// Free-tier preview: one fully-unlocked sponsor per industry, everything else locked.
const FREE_PREVIEW_INDUSTRIES = ["Healthcare", "Technology", "Hospitality"] as const;

const HIRING_ACTIVITIES = ["Very High", "High", "Medium", "Low"] as const;
const TIERS = ["Platinum", "Gold", "Silver", "Bronze", "Active"] as const;

const SORTS = [
  { key: "relevance",   label: "Relevance" },
  { key: "opportunity", label: "Opportunity Score" },
  { key: "cos",         label: "CoS 2025 Volume" },
  { key: "strength",    label: "Sponsor Strength" },
  { key: "az",          label: "A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];
const EMPTY_ARRAY: string[] = [];

// ── Helpers ────────────────────────────────────────────────────────────────

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function buildQS(params: Record<string, string | string[] | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === false) continue;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, item));
    else sp.set(k, String(v));
  }
  return sp.toString();
}

// ── Component ─────────────────────────────────────────────────────────────

export function SearchClient({
  initialIndustries = [],
  initialCities = [],
  initialRoutes = [],
}: {
  initialIndustries?: string[];
  initialCities?: string[];
  initialRoutes?: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { isPro, isProPlus } = useTier();
  const { toast } = useToast();

  // ── Filter state ──────────────────────────────────────────────────────── #
  const [q, setQ] = useState(params.get("q") ?? "");
  const [industries, setIndustries] = useState<string[]>(params.getAll("industry"));
  const [cities, setCities] = useState<string[]>(params.getAll("city"));
  const [routes, setRoutes] = useState<string[]>(params.getAll("route"));
  const [tiers, setTiers] = useState<string[]>(params.getAll("tier"));
  const [activities, setActivities] = useState<string[]>(params.getAll("activity"));
  const [aRatedOnly, setARatedOnly] = useState(params.get("aRated") === "1");
  const [minCos, setMinCos] = useState(Number(params.get("minCos") ?? 0));
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) ?? "relevance");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Type-to-filter for the long option lists (avoids hunting via scroll).
  const [citySearch, setCitySearch] = useState("");
  const [routeSearch, setRouteSearch] = useState("");

  // ── Data state ────────────────────────────────────────────────────────── #
  const [results, setResults] = useState<Sponsor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [industryList, setIndustryList] = useState<string[]>(initialIndustries);
  const [cityList, setCityList] = useState<string[]>(initialCities);
  const [routeList, setRouteList] = useState<string[]>(initialRoutes);

  const debouncedQ = useDebounced(q, 350);

  // City/Region filter is Pro-only — ignore any selection (including a
  // shared URL with ?city=) once we know the user isn't Pro.
  const effectiveCities = isPro ? cities : EMPTY_ARRAY;

  // ── Sync filters → URL ────────────────────────────────────────────────── #
  useEffect(() => {
    const qs = buildQS({
      q: debouncedQ || undefined,
      industry: industries,
      city: effectiveCities,
      route: routes,
      tier: tiers,
      activity: activities,
      aRated: aRatedOnly ? "1" : undefined,
      minCos: minCos > 0 ? minCos : undefined,
      sort: sort !== "relevance" ? sort : undefined,
    });
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedQ, industries, effectiveCities, routes, tiers, activities, aRatedOnly, minCos, sort, router]);

  // ── Fetch results ─────────────────────────────────────────────────────── #
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, industries, effectiveCities, routes, tiers, activities, aRatedOnly, minCos, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const qs = buildQS({
      q: debouncedQ || undefined,
      industry: industries,
      city: effectiveCities,
      route: routes,
      tier: tiers,
      activity: activities,
      aRated: aRatedOnly ? "1" : undefined,
      minCos: minCos > 0 ? minCos : undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    });

    fetch(`/api/sponsors?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setResults((prev) => page === 1 ? json.data : [...prev, ...json.data]);
        setTotal(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
        if (json.meta?.industryList?.length) setIndustryList(json.meta.industryList);
        if (json.meta?.cityList?.length) setCityList(json.meta.cityList);
        if (json.meta?.routeList?.length) setRouteList(json.meta.routeList);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedQ, industries, effectiveCities, routes, tiers, activities, aRatedOnly, minCos, sort, page]);

  // Free-tier preview: fetch one sponsor per target industry directly, so the
  // unlock isn't dependent on those industries happening to appear on the
  // currently-loaded page of results (e.g. Healthcare may rank low by relevance).
  const [previewSponsors, setPreviewSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    if (isPro) { setPreviewSponsors([]); return; }
    let cancelled = false;

    const targets = FREE_PREVIEW_INDUSTRIES.filter(
      (industry) => industries.length === 0 || industries.includes(industry)
    );

    Promise.all(
      targets.map((industry) => {
        const qs = buildQS({
          q: debouncedQ || undefined,
          industry,
          city: effectiveCities,
          route: routes,
          tier: tiers,
          activity: activities,
          aRated: aRatedOnly ? "1" : undefined,
          minCos: minCos > 0 ? minCos : undefined,
          pageSize: 3,
        });
        return fetch(`/api/sponsors?${qs}`).then((r) => r.json());
      })
    ).then((jsons) => {
      if (cancelled) return;
      setPreviewSponsors(jsons.flatMap((j) => j.data ?? []).filter(Boolean));
    });

    return () => { cancelled = true; };
  }, [isPro, debouncedQ, industries, effectiveCities, routes, tiers, activities, aRatedOnly, minCos]);

  const freePreviewIds = useMemo(() => {
    if (isPro) return null;
    return new Set(previewSponsors.map((s) => s.id));
  }, [isPro, previewSponsors]);

  // Free-tier users see the unlocked preview sponsors pinned to the front of the grid.
  const displayResults = useMemo(() => {
    if (!freePreviewIds || freePreviewIds.size === 0) return results;
    const rest = results.filter((s) => !freePreviewIds.has(s.id));
    return [...previewSponsors, ...rest];
  }, [results, previewSponsors, freePreviewIds]);

  // ── Helpers ───────────────────────────────────────────────────────────── #
  const toggleIn = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const clearAll = useCallback(() => {
    setQ(""); setIndustries([]); setCities([]); setRoutes([]);
    setTiers([]); setActivities([]); setARatedOnly(false); setMinCos(0);
    setSort("relevance");
  }, []);

  // ── CSV export ────────────────────────────────────────────────────────── #
  const exportCsv = useCallback(async () => {
    if (!isProPlus) {
      toast("CSV export is a Pro+ feature — upgrade to download results.", "info");
      return;
    }
    const qs = buildQS({
      q: debouncedQ || undefined,
      industry: industries,
      city: effectiveCities,
      route: routes,
      tier: tiers,
      activity: activities,
      aRated: aRatedOnly ? "1" : undefined,
      minCos: minCos > 0 ? minCos : undefined,
      sort,
      pageSize: 5000,
    });
    const json = await fetch(`/api/sponsors?${qs}`).then((r) => r.json());
    const all: Sponsor[] = json.data;
    const cols = ["Organisation", "Town", "County", "Route", "Rating", "Tier",
      "Industry", "Strength Score", "Opportunity Score", "CoS 2025 SW", "CoS 2025 GBM"];
    const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = all.map((s) => [
      s.organisationName, s.town, s.county, s.route, s.rating, s.sponsorTier,
      s.industryCategory, s.sponsorStrengthScore, s.opportunityScore,
      s.cos2025Sw ?? "", s.cos2025Gbm ?? "",
    ].map(esc).join(","));
    const csv = [cols.map(esc).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sponsoratlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${all.length} sponsors to CSV`, "success");
  }, [isProPlus, debouncedQ, industries, effectiveCities, routes, tiers, activities, aRatedOnly, minCos, sort, toast]);

  // ── Infinite scroll ───────────────────────────────────────────────────── #
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    // Stop auto-loading past the cap so the user can scroll to the footer;
    // the manual "Load more" button takes over from there.
    if (!el || page >= totalPages || page >= AUTO_LOAD_PAGES) return;
    const obs = new IntersectionObserver((e) => {
      // Functional guard caps auto-load even if the observer fires in a burst
      // before this effect re-runs and detaches. Manual "Load more" is separate.
      if (e[0].isIntersecting && !loading) setPage((p) => (p < AUTO_LOAD_PAGES ? p + 1 : p));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, totalPages, loading]);

  const activeFilterCount =
    industries.length + cities.length + routes.length + tiers.length +
    activities.length + (aRatedOnly ? 1 : 0) + (minCos > 0 ? 1 : 0);

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...industries.map((i) => ({ key: `i:${i}`, label: i, clear: () => setIndustries(industries.filter((x) => x !== i)) })),
    ...cities.map((c) => ({ key: `c:${c}`, label: c, clear: () => setCities(cities.filter((x) => x !== c)) })),
    ...routes.map((r) => ({ key: `r:${r}`, label: r, clear: () => setRoutes(routes.filter((x) => x !== r)) })),
    ...tiers.map((t) => ({ key: `t:${t}`, label: t, clear: () => setTiers(tiers.filter((x) => x !== t)) })),
    ...activities.map((a) => ({ key: `a:${a}`, label: a, clear: () => setActivities(activities.filter((x) => x !== a)) })),
    ...(aRatedOnly ? [{ key: "ar", label: "A-rated only", clear: () => setARatedOnly(false) }] : []),
    ...(minCos > 0 ? [{ key: "mc", label: `CoS ≥ ${minCos}`, clear: () => setMinCos(0) }] : []),
  ];

  // ── Filter panel (shared between desktop + mobile) ─────────────────────- #
  const FiltersPanel = (
    <div className="space-y-7">
      {/* Tier */}
      <BlurGate message="Pro filter" className="rounded-lg">
        <fieldset>
          <legend className="eyebrow mb-2.5">Sponsor Tier</legend>
          <div className="flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => toggleIn(tiers, setTiers, t)}
                aria-pressed={tiers.includes(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors duration-200",
                  tiers.includes(t)
                    ? "border-red-600/40 bg-red-600/10 text-red-600"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      </BlurGate>

      {/* Hiring activity */}
      <BlurGate message="Pro filter" className="rounded-lg">
        <fieldset>
          <legend className="eyebrow mb-2">Hiring Activity</legend>
          <div className="flex flex-wrap gap-1.5">
            {HIRING_ACTIVITIES.map((a) => (
              <button
                key={a}
                onClick={() => toggleIn(activities, setActivities, a)}
                aria-pressed={activities.includes(a)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors duration-200",
                  activities.includes(a)
                    ? "border-red-600/40 bg-red-600/10 text-red-600"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>
      </BlurGate>

      {/* Industry */}
      <fieldset>
        <legend className="eyebrow mb-2.5">Industry</legend>
        <div className="flex flex-wrap gap-1.5">
          {industryList.map((ind) => (
            <button
              key={ind}
              onClick={() => toggleIn(industries, setIndustries, ind)}
              aria-pressed={industries.includes(ind)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors duration-200",
                industries.includes(ind)
                  ? "border-red-600/40 bg-red-600/10 text-red-600"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </fieldset>

      {/* City — Pro only, blocked entirely for Free */}
      <fieldset>
        <legend className="eyebrow mb-2 flex items-center justify-between">
          City / Region
          {cities.length > 0 && <span className="tabular text-red-600">{cities.length}</span>}
        </legend>
        <BlurGate message="Pro filter" className="rounded-xl">
          {cityList.length > 8 && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Filter cities…"
                aria-label="Filter cities"
                disabled={!isPro}
                className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-7 text-xs outline-none transition focus:border-red-600/40"
              />
              {citySearch && (
                <button onClick={() => setCitySearch("")} aria-label="Clear city filter" className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
          <div className="space-y-0.5">
            {(() => {
              const q = citySearch.trim().toLowerCase();
              const list = q ? cityList.filter((c) => c.toLowerCase().includes(q)) : cityList;
              if (list.length === 0) return <p className="px-1.5 py-2 text-xs text-muted-foreground">No cities match &ldquo;{citySearch}&rdquo;.</p>;
              return list.map((city) => (
                <label key={city} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={cities.includes(city)}
                    onChange={() => toggleIn(cities, setCities, city)}
                    disabled={!isPro}
                    className="size-4 accent-red-600"
                  />
                  <span className={cn(cities.includes(city) ? "text-foreground" : "text-muted-foreground")}>{city}</span>
                </label>
              ));
            })()}
          </div>
        </BlurGate>
      </fieldset>

      {/* Route */}
      <fieldset>
        <legend className="eyebrow mb-2 flex items-center justify-between">
          Visa Route
          {routes.length > 0 && <span className="tabular text-red-600">{routes.length}</span>}
        </legend>
        {routeList.length > 8 && (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              placeholder="Filter routes…"
              aria-label="Filter visa routes"
              className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-7 text-xs outline-none transition focus:border-red-600/40"
            />
            {routeSearch && (
              <button onClick={() => setRouteSearch("")} aria-label="Clear route filter" className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
        <div className="space-y-0.5">
          {(() => {
            const q = routeSearch.trim().toLowerCase();
            const list = q ? routeList.filter((r) => r.toLowerCase().includes(q)) : routeList;
            if (list.length === 0) return <p className="px-1.5 py-2 text-xs text-muted-foreground">No routes match &ldquo;{routeSearch}&rdquo;.</p>;
            return list.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted">
                <input
                  type="checkbox"
                  checked={routes.includes(r)}
                  onChange={() => toggleIn(routes, setRoutes, r)}
                  className="size-4 accent-red-600"
                />
                <span className={cn("text-xs", routes.includes(r) ? "text-foreground" : "text-muted-foreground")}>{r}</span>
              </label>
            ));
          })()}
        </div>
      </fieldset>

      {/* A-rated only */}
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">A-rated only</span>
        <span
          role="switch"
          aria-checked={aRatedOnly}
          tabIndex={0}
          onClick={() => setARatedOnly((v) => !v)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setARatedOnly((v) => !v); } }}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            aRatedOnly ? "bg-red-600" : "bg-muted"
          )}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200", aRatedOnly ? "translate-x-[22px]" : "translate-x-0.5")} />
        </span>
      </label>

      {/* Min CoS slider */}
      <BlurGate message="Pro filter" className="rounded-lg">
        <div>
          <label htmlFor="cos-range" className="eyebrow mb-2 flex items-center justify-between">
            Min CoS 2025 <span className="tabular text-red-600">{minCos}+</span>
          </label>
          <input
            id="cos-range"
            type="range"
            min={0}
            max={500}
            step={10}
            value={minCos}
            onChange={(e) => setMinCos(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      </BlurGate>
    </div>
  );

  return (
    <div className="container py-10 sm:py-14">
      {/* Header */}
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow text-red-600">UK Sponsor Intelligence</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Sponsor Search</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground tabular">126,349</span> verified UK sponsors with{" "}
          <span className="font-semibold text-foreground">real 2025 hiring data</span>.
        </p>

        {/* Search field */}
        <div className="relative mt-7">
          <label htmlFor="sponsor-search" className="sr-only">Search sponsors</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="sponsor-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, city or industry…"
            autoComplete="off"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base text-foreground shadow-sm outline-none transition duration-200 placeholder:text-muted-foreground focus:border-red-600/40 focus:shadow-[0_0_0_4px_hsl(356.5_95%_45.7%/0.08)]"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* Filter rail (desktop) — one self-contained scroll column, no nested scrollers */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="font-heading text-base font-semibold tracking-tight">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600">
                  Clear all
                </button>
              )}
            </div>
            <div className="filter-scroll -mr-3 min-h-0 flex-1 overflow-y-auto pb-2 pr-3">
              {FiltersPanel}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
                <SlidersHorizontal className="size-4" /> Filters
                {activeFilterCount > 0 && <Badge variant="emerald" className="ml-1 px-1.5 py-0">{activeFilterCount}</Badge>}
              </Button>
              <p className="text-sm text-muted-foreground">
                {loading && page === 1 ? (
                  <Loader2 className="inline size-4 animate-spin" />
                ) : (
                  <><span className="font-semibold text-foreground tabular">{total.toLocaleString()}</span> sponsors</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={results.length === 0}
                title={isProPlus ? "Export results as CSV" : "Pro+ feature"}
                className={cn("hidden sm:inline-flex", !isProPlus && "text-muted-foreground")}
              >
                {isProPlus ? <Download className="size-4" /> : <Lock className="size-3.5" />}
                Export CSV
                {!isProPlus && <Badge variant="emerald" className="ml-1 px-1.5 py-0 text-[10px]">Pro+</Badge>}
              </Button>

              <div className="relative">
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm text-foreground transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>Sort: {s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.clear}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 py-1 pl-3 pr-2 text-xs text-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
                >
                  {c.label}
                  <X className="size-3 text-muted-foreground transition-colors group-hover:text-red-600" />
                </button>
              ))}
              <button onClick={clearAll} className="ml-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600">
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="mt-6">
            {!loading && results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-24 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-7" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">No sponsors match your filters</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Try removing a filter or widening your CoS activity range.
                </p>
                <Button variant="gradient" size="sm" className="mt-6" onClick={clearAll}>
                  <Sparkles className="size-4" /> Reset search
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {displayResults.map((s, i) => {
                    const freeUnlocked = freePreviewIds?.has(s.id) ?? false;
                    const proLocked = isPro && !isProPlus && i >= 30;
                    const freeLocked = !isPro && !freeUnlocked;
                    return (
                      <div
                        key={s.id}
                        style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 7) * 40}ms` }}
                        className="motion-safe:animate-[fade-up_0.45s_ease-out_both]"
                      >
                        <SponsorCard
                          sponsor={s}
                          isPro={!freeLocked && !proLocked}
                          locked={freeLocked || proLocked}
                          lockVariant={proLocked ? "pro_plus" : "pro"}
                        />
                      </div>
                    );
                  })}
                </div>
                {isPro && !isProPlus && total > 30 && (
                  <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
                    <p className="font-heading text-base font-semibold">You've seen your 30 Pro sponsors</p>
                    <p className="mt-1 text-sm text-muted-foreground">Upgrade to Pro Plus for unlimited access to all 126,000+ sponsors.</p>
                    <a href="/pricing" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                      Upgrade to Pro Plus →
                    </a>
                  </div>
                )}

                {/* Load more / spinner */}
                {page < totalPages && (
                  <div ref={sentinel} className="flex flex-col items-center gap-3 py-10">
                    {loading ? (
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                        Load more
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground tabular">
                      Showing {results.length.toLocaleString()} of {total.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Mobile filters */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="grid size-9 place-items-center rounded-lg hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            {FiltersPanel}
            <div className="mt-6 flex gap-2">
              {activeFilterCount > 0 && <Button variant="outline" className="flex-1" onClick={clearAll}>Clear all</Button>}
              <Button variant="gradient" className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                Show {total.toLocaleString()} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
