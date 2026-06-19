"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, SlidersHorizontal, X, ChevronDown, MapPin, Sparkles, SearchX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorCard } from "@/components/sponsor-card";
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

  const activeFilterCount =
    industries.length + cities.length + routes.length + bands.length + (aRatedOnly ? 1 : 0) + (minCos > 0 ? 1 : 0);

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

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <label htmlFor="sponsor-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="sponsor-search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Company, city or industry…"
            className="pl-9"
            autoComplete="off"
          />
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sponsors/${s.id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="truncate">{s.organisationName}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {s.town}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Industry */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Industry</legend>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRY_LIST.map((ind) => (
            <button
              key={ind}
              onClick={() => toggleIn(industries, setIndustries, ind)}
              aria-pressed={industries.includes(ind)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                industries.includes(ind)
                  ? "border-red-600/50 bg-red-600/15 text-red-600"
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </fieldset>

      {/* City */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">City / Region</legend>
        <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
          {CITY_LIST.map((city) => (
            <label key={city} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={cities.includes(city)}
                onChange={() => toggleIn(cities, setCities, city)}
                className="size-4 accent-red-600"
              />
              <span className="text-muted-foreground">{city}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Route */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route</legend>
        <div className="space-y-1">
          {ROUTE_LIST.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={routes.includes(r)}
                onChange={() => toggleIn(routes, setRoutes, r)}
                className="size-4 accent-red-600"
              />
              <span className="text-muted-foreground">{r}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* A-rated toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-sm text-foreground">A-rated only</span>
        <span
          role="switch"
          aria-checked={aRatedOnly}
          onClick={() => setARatedOnly((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            aRatedOnly ? "bg-red-600" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
              aRatedOnly ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </span>
      </label>

      {/* CoS slider */}
      <div>
        <label htmlFor="cos-range" className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hiring likelihood</legend>
        <div className="flex gap-1.5">
          {HIRING_BANDS.map((b) => (
            <button
              key={b}
              onClick={() => toggleIn(bands, setBands, b)}
              aria-pressed={bands.includes(b)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                bands.includes(b)
                  ? "border-red-600/50 bg-red-600/15 text-red-600"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          <X className="size-4" /> Clear filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Sponsor Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse {searchSponsors({}).length} indexed UK sponsors with live hiring signals.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="surface-card sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto p-5">
            {FiltersPanel}
          </div>
        </aside>

        {/* Results */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
                <span className="font-semibold text-foreground tabular">{results.length}</span> results
              </p>
            </div>

            <div className="relative">
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-surface/60 pl-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>Sort: {s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {results.length === 0 ? (
            <div className="surface-card flex flex-col items-center justify-center px-6 py-20 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <SearchX className="size-7" />
              </span>
              <h3 className="mt-4 font-heading font-semibold">No sponsors match your filters</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try removing a filter or widening your CoS activity range.
              </p>
              <Button variant="gradient" size="sm" className="mt-5" onClick={clearAll}>
                <Sparkles className="size-4" /> Reset search
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.slice(0, visible).map((s) => (
                  <SponsorCard key={s.id} sponsor={s} />
                ))}
              </div>
              {visible < results.length && (
                <div ref={sentinel} className="flex justify-center py-8">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more ({results.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
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
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-5 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="grid size-9 place-items-center rounded-md hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            {FiltersPanel}
            <Button
              variant="gradient"
              className="mt-6 w-full"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {results.length} results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
