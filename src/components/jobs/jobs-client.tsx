"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, X, Briefcase, MapPin, Clock, Building2,
  ChevronDown, SearchX, Sparkles, CheckCircle2, ExternalLink,
  ShieldCheck, RefreshCw, Zap, Lock, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LiveJob, JobFeedSource } from "@/lib/job-feed";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useTier } from "@/hooks/use-tier";
import { BlurGate } from "@/components/tier-gate";

// Free users see this many real listings before hitting the paywall.
const FREE_VISIBLE_JOBS = 3;
const FREE_TEASER_JOBS = 3;

const FEATURED_INDUSTRIES = ["Hospitality", "Technology", "Healthcare"] as const;

const SORT_OPTIONS = [
  { key: "recent" as const, label: "Most recent" },
  { key: "company" as const, label: "Company A–Z" },
  { key: "title" as const, label: "Title A–Z" },
];
type SortKey = (typeof SORT_OPTIONS)[number]["key"];
const PAGE_SIZE = 15;

// Subtle per-ATS accent so the source is scannable without shouting.
const SOURCE_META: Record<JobFeedSource, { dot: string; ring: string }> = {
  Greenhouse: { dot: "bg-emerald-500", ring: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400" },
  Lever: { dot: "bg-violet-500", ring: "border-violet-500/30 text-violet-700 dark:text-violet-400" },
  Workable: { dot: "bg-sky-500", ring: "border-sky-500/30 text-sky-700 dark:text-sky-400" },
};

// Deterministic monogram tint from the company name — stable across renders.
const AVATAR_TINTS = [
  "bg-red-600/10 text-red-700",
  "bg-amber-600/10 text-amber-700",
  "bg-emerald-600/10 text-emerald-700",
  "bg-sky-600/10 text-sky-700",
  "bg-violet-600/10 text-violet-700",
  "bg-rose-600/10 text-rose-700",
];
function avatarTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}
function monogram(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function postedLabel(job: LiveJob): string | null {
  if (job.postedDaysAgo == null) return null;
  if (job.postedDaysAgo === 0) return "Today";
  if (job.postedDaysAgo === 1) return "Yesterday";
  if (job.postedDaysAgo < 7) return `${job.postedDaysAgo}d ago`;
  if (job.postedDaysAgo < 30) return `${Math.floor(job.postedDaysAgo / 7)}w ago`;
  return `${Math.floor(job.postedDaysAgo / 30)}mo ago`;
}

export function JobsClient({ jobs }: { jobs: LiveJob[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { isPro } = useTier();

  // Facets derived from the real data — never a hard-coded list.
  const { industryList, cityList, typeList, sourceCount } = useMemo(() => {
    const ind = new Map<string, number>();
    const city = new Map<string, number>();
    const type = new Map<string, number>();
    const src = new Set<string>();
    for (const j of jobs) {
      ind.set(j.sponsorIndustry, (ind.get(j.sponsorIndustry) ?? 0) + 1);
      const c = j.location.split(",")[0].trim();
      if (c) city.set(c, (city.get(c) ?? 0) + 1);
      if (j.employmentType) type.set(j.employmentType, (type.get(j.employmentType) ?? 0) + 1);
      src.add(j.source);
    }
    const byCount = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return {
      industryList: byCount(ind),
      cityList: byCount(city),
      typeList: byCount(type),
      sourceCount: src.size,
    };
  }, [jobs]);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [industries, setIndustries] = useState<string[]>(params.getAll("industry"));
  const [cities, setCities] = useState<string[]>(params.getAll("city"));
  const [jobTypes, setJobTypes] = useState<string[]>(params.getAll("type"));
  const [sort, setSort] = useState<SortKey>("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const debouncedQ = useDebounced(q);

  // Location filter is Pro-only — ignore any selection (including a shared
  // URL with ?city=) once we know the user isn't Pro.
  const effectiveCities = isPro ? cities : [];

  useEffect(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set("q", debouncedQ);
    industries.forEach((i) => sp.append("industry", i));
    effectiveCities.forEach((c) => sp.append("city", c));
    jobTypes.forEach((t) => sp.append("type", t));
    router.replace(`/jobs${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    setVisible(PAGE_SIZE);
  }, [debouncedQ, industries, effectiveCities, jobTypes, router]);

  const results = useMemo(() => {
    const n = debouncedQ.trim().toLowerCase();
    let out = jobs.filter((j) => {
      if (industries.length && !industries.includes(j.sponsorIndustry)) return false;
      if (effectiveCities.length && !effectiveCities.includes(j.location.split(",")[0].trim())) return false;
      if (jobTypes.length && !(j.employmentType && jobTypes.includes(j.employmentType))) return false;
      if (n) {
        return (
          j.title.toLowerCase().includes(n) ||
          j.sponsorName.toLowerCase().includes(n) ||
          j.location.toLowerCase().includes(n) ||
          j.sponsorIndustry.toLowerCase().includes(n) ||
          (j.department ?? "").toLowerCase().includes(n)
        );
      }
      return true;
    });
    switch (sort) {
      case "company":
        out = [...out].sort((a, b) => a.sponsorName.localeCompare(b.sponsorName));
        break;
      case "title":
        out = [...out].sort((a, b) => a.title.localeCompare(b.title));
        break;
      // "recent" keeps the server's most-recent-first ordering
    }
    return out;
  }, [jobs, debouncedQ, industries, effectiveCities, jobTypes, sort]);

  const toggleIn = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const clearAll = useCallback(() => {
    setQ(""); setIndustries([]); setCities([]); setJobTypes([]);
  }, []);

  const toggleSave = (id: string) => {
    const next = savedJobs.includes(id) ? savedJobs.filter((x) => x !== id) : [...savedJobs, id];
    setSavedJobs(next);
    toast(next.includes(id) ? "Job saved" : "Job removed", next.includes(id) ? "success" : "info");
  };

  const activeFilterCount = industries.length + effectiveCities.length + jobTypes.length;
  const sponsorCount = useMemo(() => new Set(jobs.map((j) => j.sponsorId)).size, [jobs]);

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
    <div className="space-y-7">
      {/* Industry */}
      {industryList.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-2.5">Industry</legend>
          <div className="flex flex-wrap gap-1.5">
            {industryList.map((ind) => (
              <button
                key={ind}
                onClick={() => toggleIn(industries, setIndustries, ind)}
                aria-pressed={industries.includes(ind)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors duration-200",
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
      )}

      {/* City — Pro only, blocked entirely for Free */}
      {cityList.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-2 flex items-center justify-between">
            Location
            {effectiveCities.length > 0 && <span className="tabular text-red-600">{effectiveCities.length}</span>}
          </legend>
          <BlurGate message="Pro filter" className="rounded-xl">
          {cityList.length > 8 && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Filter locations…"
                aria-label="Filter locations"
                disabled={!isPro}
                className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-7 text-xs outline-none transition focus:border-red-600/40"
              />
              {citySearch && (
                <button onClick={() => setCitySearch("")} aria-label="Clear location filter" className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
          <div className="space-y-0.5">
            {(() => {
              const term = citySearch.trim().toLowerCase();
              const list = term ? cityList.filter((c) => c.toLowerCase().includes(term)) : cityList;
              if (list.length === 0) return <p className="px-1.5 py-2 text-xs text-muted-foreground">No locations match &ldquo;{citySearch}&rdquo;.</p>;
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
      )}

      {/* Job type */}
      {typeList.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-2">Job type</legend>
          <div className="flex flex-wrap gap-1.5">
            {typeList.map((t) => (
              <button
                key={t}
                onClick={() => toggleIn(jobTypes, setJobTypes, t)}
                aria-pressed={jobTypes.includes(t)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors duration-200",
                  jobTypes.includes(t)
                    ? "border-red-600/40 bg-red-600/10 text-red-600"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );

  // Top industries surfaced as one-tap chips under the search bar.
  const quickIndustries = industryList.slice(0, 6);

  return (
    <div className="container py-10 sm:py-14">
      {/* ── Hero ── */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow inline-flex items-center justify-center gap-2">
          <span className="live-dot" aria-hidden="true" /> Live Sponsored Jobs
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Job Board</h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Real openings, pulled live from licensed UK visa sponsors&rsquo; own career systems — no
          aggregators, no stale posts.
        </p>

        {/* Search — the primary action */}
        <div className="group relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-red-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search jobs"
            placeholder="Job title, company or city…"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base shadow-sm outline-none transition duration-200 placeholder:text-muted-foreground focus:border-red-600/40 focus:shadow-[0_0_0_4px_hsl(356.5_95%_45.7%/0.08)]"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Quick category chips */}
        {quickIndustries.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Popular:</span>
            {quickIndustries.map((ind) => {
              const active = industries.includes(ind);
              return (
                <button
                  key={ind}
                  onClick={() => toggleIn(industries, setIndustries, ind)}
                  aria-pressed={active}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200",
                    active
                      ? "border-red-600/40 bg-red-600/10 text-red-600"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {ind}
                </button>
              );
            })}
          </div>
        )}

        {/* Trust strip */}
        <dl className="mx-auto mt-9 grid max-w-xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/60 py-4 text-center backdrop-blur-sm">
          <div className="px-2">
            <dt className="font-display text-2xl text-foreground tabular sm:text-3xl">{jobs.length.toLocaleString()}</dt>
            <dd className="eyebrow mt-1 normal-case tracking-normal">Live UK roles</dd>
          </div>
          <div className="px-2">
            <dt className="font-display text-2xl text-foreground tabular sm:text-3xl">{sponsorCount}</dt>
            <dd className="eyebrow mt-1 normal-case tracking-normal">Verified sponsors</dd>
          </div>
          <div className="px-2">
            <dt className="font-display text-2xl text-foreground tabular sm:text-3xl">{sourceCount}</dt>
            <dd className="eyebrow mt-1 normal-case tracking-normal">ATS sources</dd>
          </div>
        </dl>

        {/* Trust badges */}
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-red-600" /> Home Office–licensed sponsors</li>
          <li className="flex items-center gap-1.5"><RefreshCw className="size-3.5 text-red-600" /> Re-checked hourly</li>
          <li className="flex items-center gap-1.5"><Zap className="size-3.5 text-red-600" /> Straight from employers&rsquo; systems</li>
        </ul>
      </header>

      {/* ── Featured industry previews (free, no filters active) ── */}
      {!isPro && activeFilterCount === 0 && !debouncedQ && (
        <div className="mt-16 space-y-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3 text-red-600">Free preview</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Top jobs by industry
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Hand-picked live roles from three high-demand sectors — no sign-up required.
            </p>
          </div>

          {FEATURED_INDUSTRIES.map((industry) => {
            const industryJobs = jobs
              .filter((j) => j.sponsorIndustry === industry)
              .slice(0, 3);
            if (industryJobs.length === 0) return null;
            return (
              <div key={industry}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-0.5">Featured</p>
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {industry} Jobs
                    </h3>
                  </div>
                  <button
                    onClick={() => setIndustries([industry])}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    View all <ChevronRight className="size-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {industryJobs.map((job, i) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      saved={savedJobs.includes(job.id)}
                      onSave={() => toggleSave(job.id)}
                      style={{ animationDelay: `${i * 30}ms` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="font-semibold">Want to see all live roles?</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Upgrade to Pro to unlock every visa-sponsored job across all industries.
            </p>
            <Link href="/pricing">
              <Button size="sm" className="mt-4 bg-red-600 text-white hover:bg-red-700">
                Upgrade to Pro <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">or search all jobs below</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* Desktop sidebar — one self-contained scroll column, no nested scrollers */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-red-600">
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
          <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-1 pb-4 pt-1 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <SlidersHorizontal className="size-4" /> Filters
                {activeFilterCount > 0 && <Badge variant="emerald" className="ml-1 px-1.5 py-0">{activeFilterCount}</Badge>}
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular">{results.length}</span> {results.length === 1 ? "job" : "jobs"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="hidden cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 sm:inline lg:hidden">
                  Clear
                </button>
              )}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort jobs"
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[...industries.map((v) => ["industry", v] as const),
                ...effectiveCities.map((v) => ["city", v] as const),
                ...jobTypes.map((v) => ["type", v] as const)].map(([kind, val]) => (
                <button
                  key={`${kind}:${val}`}
                  onClick={() => {
                    if (kind === "industry") toggleIn(industries, setIndustries, val);
                    else if (kind === "city") toggleIn(cities, setCities, val);
                    else toggleIn(jobTypes, setJobTypes, val);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-red-600/30 bg-red-600/10 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-600/15"
                >
                  {val} <X className="size-3" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-24 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-7" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold">
                  {jobs.length === 0 ? "No live jobs right now" : "No jobs match your filters"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {jobs.length === 0
                    ? "We re-check every sponsor's career system hourly. Check back shortly."
                    : "Try removing a filter or searching a different term."}
                </p>
                {jobs.length > 0 && (
                  <Button variant="gradient" size="sm" className="mt-6" onClick={clearAll}>
                    <Sparkles className="size-4" /> Reset search
                  </Button>
                )}
              </div>
            ) : isPro ? (
              <>
                {results.slice(0, visible).map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={savedJobs.includes(job.id)}
                    onSave={() => toggleSave(job.id)}
                    style={{ animationDelay: `${Math.min(i, 7) * 30}ms` }}
                  />
                ))}
                {visible < results.length && (
                  <div ref={sentinel} className="flex flex-col items-center gap-3 py-8">
                    <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Load more roles
                    </Button>
                    <p className="text-xs text-muted-foreground tabular">
                      Showing {Math.min(visible, results.length)} of {results.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {results.slice(0, FREE_VISIBLE_JOBS).map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={savedJobs.includes(job.id)}
                    onSave={() => toggleSave(job.id)}
                    style={{ animationDelay: `${Math.min(i, 7) * 30}ms` }}
                  />
                ))}
                {results.length > FREE_VISIBLE_JOBS && (
                  <JobsPaywall
                    teaser={results.slice(FREE_VISIBLE_JOBS, FREE_VISIBLE_JOBS + FREE_TEASER_JOBS)}
                    remaining={results.length - FREE_VISIBLE_JOBS}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Mobile filters sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters" className="grid size-9 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            {FiltersPanel}
            <div className="mt-6 flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" className="flex-1" onClick={clearAll}>Clear all</Button>
              )}
              <Button variant="gradient" className="flex-1" onClick={() => setMobileOpen(false)}>
                Show {results.length} jobs
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsPaywall({ teaser, remaining }: { teaser: LiveJob[]; remaining: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none space-y-3 blur-[3px]" aria-hidden="true">
        {teaser.map((job, i) => (
          <JobCard key={job.id} job={job} saved={false} onSave={() => {}} style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/85 backdrop-blur-[2px]">
        <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
          <Lock className="size-5 text-red-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold">{remaining} more live roles</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Pro to see every visa-sponsored job on the board.
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="mt-1 bg-red-600 text-white hover:bg-red-700">
            Upgrade to Pro <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function JobCard({
  job, saved, onSave, style,
}: {
  job: LiveJob;
  saved: boolean;
  onSave: () => void;
  style?: React.CSSProperties;
}) {
  const posted = postedLabel(job);
  const src = SOURCE_META[job.source];
  return (
    <div
      style={style}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-600/20 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] motion-safe:animate-[fade-up_0.4s_ease-out_both]"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />

      <div className="flex items-start gap-4">
        {/* Company monogram */}
        <Link
          href={`/sponsors/${job.sponsorId}`}
          aria-label={`View ${job.sponsorName}`}
          className={cn(
            "relative z-10 mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl font-heading text-sm font-bold transition-transform duration-200 group-hover:scale-105",
            avatarTint(job.sponsorName)
          )}
        >
          {monogram(job.sponsorName)}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="emerald" className="gap-1">
              <CheckCircle2 className="size-3" /> Visa Sponsored
            </Badge>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {job.sponsorIndustry}
            </span>
          </div>

          <h3 className="mt-2 font-heading text-base font-semibold leading-snug">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-red-600">
              {job.title}
              <span className="absolute inset-0" aria-hidden="true" />
            </a>
          </h3>

          <p className="mt-0.5 text-sm font-medium text-muted-foreground">
            <Link href={`/sponsors/${job.sponsorId}`} className="relative z-10 transition-colors hover:text-foreground">
              {job.sponsorName}
            </Link>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-3.5" /> {job.employmentType}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" /> {job.department}
              </span>
            )}
            {posted && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> {posted}
              </span>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove saved job" : "Save job"}
          className={cn(
            "relative z-10 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-border transition-colors hover:border-red-600/50",
            saved && "border-red-600/50 bg-red-600/10"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn("size-4 transition-all", saved ? "fill-red-600 text-red-600" : "fill-none text-muted-foreground")}
            stroke="currentColor" strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium", src.ring)}>
          <span className={cn("size-1.5 rounded-full", src.dot)} aria-hidden="true" /> {job.source}
        </span>
        <Link
          href={`/sponsors/${job.sponsorId}`}
          className="relative z-10 hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/20 sm:inline-flex"
        >
          View sponsor
        </Link>
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
        >
          Apply <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
