"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, X, Briefcase, MapPin, Clock, Banknote,
  ChevronDown, SearchX, Sparkles, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchJobs, JOBS, type Job, type JobType } from "@/lib/mock-jobs";
import { INDUSTRY_LIST, CITY_LIST } from "@/lib/mock-data";
import { formatGBP, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Contract", "Remote"];
const SORT_OPTIONS = [
  { key: "recent" as const, label: "Most recent" },
  { key: "salary_high" as const, label: "Salary: high to low" },
  { key: "salary_low" as const, label: "Salary: low to high" },
];
const PAGE_SIZE = 15;

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function JobsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [industries, setIndustries] = useState<string[]>(params.getAll("industry"));
  const [cities, setCities] = useState<string[]>(params.getAll("city"));
  const [jobTypes, setJobTypes] = useState<string[]>(params.getAll("type"));
  const [sort, setSort] = useState<"recent" | "salary_high" | "salary_low">("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const debouncedQ = useDebounced(q);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set("q", debouncedQ);
    industries.forEach((i) => sp.append("industry", i));
    cities.forEach((c) => sp.append("city", c));
    jobTypes.forEach((t) => sp.append("type", t));
    router.replace(`/jobs${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    setVisible(PAGE_SIZE);
  }, [debouncedQ, industries, cities, jobTypes, router]);

  const results = useMemo(
    () => searchJobs({ q: debouncedQ, industries, cities, jobTypes, sort }),
    [debouncedQ, industries, cities, jobTypes, sort]
  );

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

  const activeFilterCount = industries.length + cities.length + jobTypes.length;

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
      <fieldset>
        <legend className="eyebrow mb-2.5">Industry</legend>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRY_LIST.map((ind) => (
            <button
              key={ind}
              onClick={() => toggleIn(industries, setIndustries, ind)}
              aria-pressed={industries.includes(ind)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
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
        <legend className="eyebrow mb-2">Location</legend>
        <div className="-mr-1 max-h-44 space-y-0.5 overflow-y-auto pr-1">
          {CITY_LIST.map((city) => (
            <label key={city} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-muted">
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

      {/* Job type */}
      <fieldset>
        <legend className="eyebrow mb-2">Job type</legend>
        <div className="flex flex-wrap gap-1.5">
          {JOB_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleIn(jobTypes, setJobTypes, t)}
              aria-pressed={jobTypes.includes(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
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
    </div>
  );

  return (
    <div className="container py-10 sm:py-14">
      {/* Header */}
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Sponsored Jobs</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Job Board</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          <span className="font-semibold text-foreground tabular">{JOBS.length.toLocaleString()}</span> jobs from verified UK sponsors. Every listing visa-sponsored.
        </p>

        {/* Search */}
        <div className="relative mt-7">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Job title, company or city…"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base outline-none transition duration-200 placeholder:text-muted-foreground focus:border-red-600/40 focus:shadow-[0_0_0_4px_hsl(0_72%_51%/0.08)]"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-muted-foreground hover:text-red-600">
                  Clear all
                </button>
              )}
            </div>
            {FiltersPanel}
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <SlidersHorizontal className="size-4" /> Filters
                {activeFilterCount > 0 && <Badge variant="emerald" className="ml-1 px-1.5 py-0">{activeFilterCount}</Badge>}
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular">{results.length}</span> jobs
              </p>
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="h-9 appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm focus-visible:outline-none"
              >
                {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-24 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-7" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold">No jobs match your filters</h3>
                <Button variant="gradient" size="sm" className="mt-6" onClick={clearAll}>
                  <Sparkles className="size-4" /> Reset search
                </Button>
              </div>
            ) : (
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

      {/* Mobile filters sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-muted">
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

function JobCard({
  job, saved, onSave, style,
}: {
  job: Job;
  saved: boolean;
  onSave: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] motion-safe:animate-[fade-up_0.4s_ease-out_both]"
    >
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="emerald" className="gap-1">
              <CheckCircle2 className="size-3" /> Visa Sponsored
            </Badge>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {job.sponsorIndustry}
            </span>
          </div>

          <h3 className="mt-2 font-heading text-[15px] font-semibold leading-snug">
            <Link href={`/sponsors/${job.sponsorId}`} className="hover:text-red-600 transition-colors">
              {job.title}
            </Link>
          </h3>

          <p className="mt-1 text-sm font-medium text-muted-foreground">{job.sponsorName}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Banknote className="size-3.5" /> {formatGBP(job.salaryMin)}–{formatGBP(job.salaryMax)}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5" /> {job.jobType}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> {job.postedDaysAgo}d ago · {job.source}
            </span>
          </div>

          {/* Skills */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="outline" className="text-[11px]">SOC {job.socCode}</Badge>
          <button
            onClick={onSave}
            aria-pressed={saved}
            className={cn(
              "mt-1 grid size-8 place-items-center rounded-lg border border-border transition-colors hover:border-red-600/50",
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
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <Link href={`/sponsors/${job.sponsorId}`} className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/20"
        )}>
          View sponsor
        </Link>
        <button
          onClick={() => {
            // In production: open application modal or redirect to source
            window.open(`/sponsors/${job.sponsorId}`, "_blank");
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Apply <ExternalLink className="size-3" />
        </button>
      </div>
    </div>
  );
}
