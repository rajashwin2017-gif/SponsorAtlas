"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, SlidersHorizontal, X, ChevronDown, MapPin, Sparkles, SearchX, Download, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorCard } from "@/components/sponsor-card";
import { useToast } from "@/components/ui/toast";
import { useTier } from "@/hooks/use-tier";
import {
  searchSponsors, suggestSponsorNames, INDUSTRY_LIST, ROUTE_LIST, CITY_LIST, type SortKey,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const HIRING_BANDS = ["High", "Medium", "Low"] as const;
const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "recent", label: "Recently Added" },
  { key: "hiring", label: "Hiring Likelihood" },
  { key: "cos", label: "CoS Activity" },
];
const PAGE_SIZE = 12;

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { isPro, isProPlus } = useTier();
  const { toast } = useToast();

  // ── State initialised from URL ──
  const [q, setQ] = useState(params.get("q") ?? "");
  const [industries, setIndustries] = useState<string[]>(params.getAll("industry"));
  const [cities, setCities] = useState<string[]>(params.getAll("city"));
  const [routes, setRoutes] = useState<string[]>(params.getAll("route"));
  const [aRatedOnly, setARatedOnly] = useState(params.get("aRated") === "1");
  const [minCos, setMinCos] = useState(Number(params.get("minCos") ?? 0));
  const [bands, setBands] = useState<string[]>(params.getAll("band"));
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) ?? "relevance");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const debouncedQ = useDebounced(q, 300);
  const total = useMemo(() => searchSponsors({}).length, []);

  // ── Sync filters → URL (shareable) ──
  useEffect(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set("q", debouncedQ);
    industries.forEach((i) => sp.append("industry", i));
    cities.forEach((c) => sp.append("city", c));
    routes.forEach((r) => sp.append("route", r));
    if (aRatedOnly) sp.set("aRated", "1");
    if (minCos > 0) sp.set("minCos", String(minCos));
    bands.forEach((b) => sp.append("band", b));
    if (sort !== "relevance") sp.set("sort", sort);
    router.replace(`/search${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    setVisible(PAGE_SIZE);
  }, [debouncedQ, industries, cities, routes, aRatedOnly, minCos, bands, sort, router]);

  const results = useMemo(
    () => searchSponsors({ q: debouncedQ, industries, cities, routes, aRatedOnly, minCos, hiringBands: bands, sort }),
    [debouncedQ, industries, cities, routes, aRatedOnly, minCos, bands, sort]
  );

  const suggestions = useMemo(() => (showSuggest ? suggestSponsorNames(q, 6) : []), [q, showSuggest]);

  const toggleIn = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const clearAll = useCallback(() => {
    setQ(""); setIndustries([]); setCities([]); setRoutes([]);
    setARatedOnly(false); setMinCos(0); setBands([]); setSort("relevance");
  }, []);

  // Pro+ only: export the current result set as a CSV download.
  const exportCsv = useCallback(() => {
    if (!isProPlus) {
      toast("CSV export is a Pro+ feature — upgrade to download results.", "info");
      return;
    }
    const cols = [
      "Organisation", "Town", "County", "Route", "Rating", "Industry",
      "Hiring score", "Live jobs", "CoS 2026", "Suggested SOC codes",
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = results.map((s) => [
      s.organisationName, s.town, s.county, s.route, s.rating, s.industryCategory,
      s.hiringLikelihoodScore, s.liveJobsCount, s.cosActivity2026, s.suggestedSocCodes.join("; "),
    ].map(esc).join(","));
    const csv = [cols.map(esc).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sponsoratlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${results.length} sponsors to CSV`, "success");
  }, [isProPlus, results, toast]);

  const activeFilterCount =
    industries.length + cities.length + routes.length + bands.length + (aRatedOnly ? 1 : 0) + (minCos > 0 ? 1 : 0);

  // Removable summary chips for every active filter
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...industries.map((i) => ({ key: `i:${i}`, label: i, clear: () => setIndustries(industries.filter((x) => x !== i)) })),
    ...cities.map((c) => ({ key: `c:${c}`, label: c, clear: () => setCities(cities.filter((x) => x !== c)) })),
    ...routes.map((r) => ({ key: `r:${r}`, label: r, clear: () => setRoutes(routes.filter((x) => x !== r)) })),
    ...bands.map((b) => ({ key: `b:${b}`, label: `${b} hiring`, clear: () => setBands(bands.filter((x) => x !== b)) })),
    ...(aRatedOnly ? [{ key: "a", label: "A-rated only", clear: () => setARatedOnly(false) }] : []),
    ...(minCos > 0 ? [{ key: "m", label: `CoS ≥ ${minCos}`, clear: () => setMinCos(0) }] : []),
  ];

  // ── Infinite scroll ──
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, results.length));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [results.length]);

  // ── Hero search field (the primary CTA of a directory) ──
  const SearchField = (
    <div className="relative">
      <label htmlFor="sponsor-search" className="sr-only">Search sponsors</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        id="sponsor-search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setShowSuggest(true); }}
        onFocus={() => setShowSuggest(true)}
        onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
        placeholder="Search company, city or industry…"
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base text-foreground shadow-sm outline-none transition duration-200 placeholder:text-muted-foreground focus:border-red-600/40 focus:shadow-[0_0_0_4px_hsl(0_72%_51%/0.08)]"
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
      {suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sponsors/${s.id}`}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="truncate font-medium">{s.organisationName}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {s.town}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ── Filter controls (shared between desktop rail + mobile sheet) ──
  const FiltersPanel = (
    <div className="space-y-7">
      {/* Industry */}
      <fieldset>
        <legend className="eyebrow mb-2.5">Industry</legend>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRY_LIST.map((ind) => (
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

      {/* City */}
      <fieldset>
        <legend className="eyebrow mb-2">City / Region</legend>
        <div className="-mr-1 max-h-44 space-y-0.5 overflow-y-auto pr-1">
          {CITY_LIST.map((city) => (
            <label key={city} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted">
              <input
                type="checkbox"
                checked={cities.includes(city)}
                onChange={() => toggleIn(cities, setCities, city)}
                className="size-4 accent-red-600"
              />
              <span className={cn(cities.includes(city) ? "text-foreground" : "text-muted-foreground")}>{city}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Route */}
      <fieldset>
        <legend className="eyebrow mb-2">Route</legend>
        <div className="space-y-0.5">
          {ROUTE_LIST.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-muted">
              <input
                type="checkbox"
                checked={routes.includes(r)}
                onChange={() => toggleIn(routes, setRoutes, r)}
                className="size-4 accent-red-600"
              />
              <span className={cn(routes.includes(r) ? "text-foreground" : "text-muted-foreground")}>{r}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* A-rated toggle */}
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
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              aRatedOnly ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </span>
      </label>

      {/* CoS slider */}
      <div>
        <label htmlFor="cos-range" className="eyebrow mb-2 flex items-center justify-between">
          Min CoS activity (2025) <span className="tabular text-red-600">{minCos}+</span>
        </label>
        <input
          id="cos-range"
          type="range"
          min={0}
          max={300}
          step={10}
          value={minCos}
          onChange={(e) => setMinCos(Number(e.target.value))}
          className="w-full accent-red-600"
        />
      </div>

      {/* Hiring likelihood */}
      <fieldset>
        <legend className="eyebrow mb-2">Hiring likelihood</legend>
        <div className="flex gap-1.5">
          {HIRING_BANDS.map((b) => (
            <button
              key={b}
              onClick={() => toggleIn(bands, setBands, b)}
              aria-pressed={bands.includes(b)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors duration-200",
                bands.includes(b)
                  ? "border-red-600/40 bg-red-600/10 text-red-600"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="container py-10 sm:py-14">
      {/* ── Header + hero search ── */}
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow">UK Sponsor Directory</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Sponsor Search</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Search <span className="font-semibold text-foreground tabular">{total.toLocaleString()}</span> verified UK
          sponsors with live hiring signals.
        </p>
        <div className="mt-7">{SearchField}</div>
      </header>

      {/* ── Body ── */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* Filter rail (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
                >
                  Clear all
                </button>
              )}
            </div>
            {FiltersPanel}
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" /> Filters
                {activeFilterCount > 0 && (
                  <Badge variant="emerald" className="ml-1 px-1.5 py-0">{activeFilterCount}</Badge>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular">{results.length}</span>{" "}
                {results.length === 1 ? "sponsor" : "sponsors"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={results.length === 0}
                title={isProPlus ? "Export results as CSV" : "Pro+ feature"}
                className={cn(!isProPlus && "text-muted-foreground")}
              >
                {isProPlus ? <Download className="size-4" /> : <Lock className="size-3.5" />}
                Export CSV
                {!isProPlus && (
                  <Badge variant="emerald" className="ml-1 px-1.5 py-0 text-[10px]">Pro+</Badge>
                )}
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
              <button
                onClick={clearAll}
                className="ml-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="mt-6">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-24 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-7" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold">No sponsors match your filters</h3>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Try removing a filter or widening your CoS activity range.
                </p>
                <Button variant="gradient" size="sm" className="mt-6" onClick={clearAll}>
                  <Sparkles className="size-4" /> Reset search
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.slice(0, visible).map((s, i) => (
                    <div
                      key={s.id}
                      style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}
                      className="motion-safe:animate-[fade-up_0.45s_ease-out_both]"
                    >
                      <SponsorCard sponsor={s} isPro={isPro} />
                    </div>
                  ))}
                </div>
                {visible < results.length && (
                  <div ref={sentinel} className="flex flex-col items-center gap-3 py-10">
                    <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Load more
                    </Button>
                    <p className="text-xs text-muted-foreground tabular">
                      Showing {Math.min(visible, results.length)} of {results.length}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Mobile filters bottom sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="grid size-9 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            {FiltersPanel}
            <div className="mt-6 flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" className="flex-1" onClick={clearAll}>
                  Clear all
                </Button>
              )}
              <Button
                variant="gradient"
                className="flex-1"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {results.length} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
