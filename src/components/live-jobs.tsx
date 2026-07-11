"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, MapPin, ExternalLink, Loader2, Lock,
  Building2, ChevronRight, AlertCircle, Search, X, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTier } from "@/hooks/use-tier";
import type { JobsResponse, JobListing } from "@/app/api/jobs/[sponsorId]/route";

interface LiveJobsProps {
  sponsorId: string;
  companyName: string;
  /** Optional override — defaults to the user's actual subscription tier. */
  isPro?: boolean;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function SourceBadge({ source }: { source: JobsResponse["source"] }) {
  const map: Record<string, { label: string; color: string }> = {
    greenhouse: { label: "Greenhouse ATS", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    lever:      { label: "Lever ATS",      color: "bg-blue-50 text-blue-700 border-blue-200" },
    adzuna:     { label: "Adzuna Jobs",    color: "bg-orange-50 text-orange-700 border-orange-200" },
    nhs:        { label: "NHS Jobs",       color: "bg-violet-50 text-violet-700 border-violet-200" },
    url:        { label: "Careers Page",   color: "bg-gray-50 text-gray-600 border-gray-200" },
    none:       { label: "No feed",        color: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const m = map[source] ?? map.none;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", m.color)}>
      {m.label}
    </span>
  );
}

function JobCard({ job }: { job: JobListing }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  return (
    <a
      href={job.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-red-300 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug group-hover:text-red-600 line-clamp-2">
          {job.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              {job.location}
            </span>
          )}
          {job.department && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3 shrink-0" />
              {job.department}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <Banknote className="size-3 shrink-0" />
              {salary}
            </span>
          )}
          {job.postedAt && (
            <span className="text-muted-foreground">{timeAgo(job.postedAt)}</span>
          )}
        </div>
        {job.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{job.description}</p>
        )}
        {job.employmentType && (
          <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {job.employmentType}
          </span>
        )}
      </div>
      <div className="shrink-0 pt-0.5">
        <span className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-red-700 whitespace-nowrap">
          Apply <ExternalLink className="size-3" />
        </span>
      </div>
    </a>
  );
}

function ProGate({ companyName }: { companyName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <div className="pointer-events-none select-none space-y-3 p-4 blur-[3px]">
        {[
          { title: "Senior Software Engineer", location: "London, UK", salary: "£85k – £110k" },
          { title: "Product Manager", location: "Remote (UK)", salary: "£70k – £90k" },
          { title: "Data Scientist", location: "Manchester, UK", salary: "£60k – £80k" },
        ].map((j) => (
          <div key={j.title} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-semibold">{j.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{j.location} · {j.salary}</p>
            </div>
            <span className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Apply</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-[2px]">
        <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
          <Lock className="size-5 text-red-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold">Unlock Live Jobs</p>
          <p className="mt-1 text-sm text-muted-foreground">
            See all open roles at {companyName} and apply directly.
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="mt-1 bg-red-600 hover:bg-red-700 text-white">
            Upgrade to Pro <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function LiveJobs({ sponsorId, companyName, isPro: isProOverride }: LiveJobsProps) {
  const { isPro: tierIsPro } = useTier();
  const isPro = isProOverride ?? tierIsPro;
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [inputKw, setInputKw] = useState("");
  const [inputLoc, setInputLoc] = useState("");

  const load = useCallback((kw: string, loc: string) => {
    if (!isPro) return;
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams();
    if (kw) qs.set("keyword", kw);
    if (loc) qs.set("location", loc);
    fetch(`/api/jobs/${sponsorId}?${qs}`)
      .then((r) => r.json())
      .then((d: JobsResponse) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [sponsorId, isPro]);

  // Initial load
  useEffect(() => { if (isPro) load("", ""); }, [isPro, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setKeyword(inputKw);
    setLocation(inputLoc);
    load(inputKw, inputLoc);
  }

  function clearSearch() {
    setInputKw(""); setInputLoc("");
    setKeyword(""); setLocation("");
    load("", "");
  }

  const hasFilter = keyword || location;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-red-600" />
          <h2 className="font-heading text-base font-semibold">Live Jobs</h2>
          {data && <SourceBadge source={data.source} />}
        </div>
        {data?.careersUrl && (
          <a
            href={data.careersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline shrink-0"
          >
            View all <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {!isPro && <ProGate companyName={companyName} />}

      {isPro && (
        <>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Job title or keyword…"
                  value={inputKw}
                  onChange={(e) => setInputKw(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="City…"
                  value={inputLoc}
                  onChange={(e) => setInputLoc(e.target.value)}
                  className="h-10 w-28 rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 sm:w-32"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="h-10 flex-1 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 min-h-[44px]"
              >
                Search
              </button>
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex h-10 w-11 items-center justify-center rounded-lg border border-border hover:bg-muted min-h-[44px]"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </form>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Fetching live jobs…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <AlertCircle className="size-4 shrink-0" />
              Unable to load jobs right now. Try again later.
            </div>
          )}

          {/* Job listings */}
          {!loading && !error && data && (
            <>
              {data.jobs.length > 0 && (
                <div className="space-y-3">
                  {hasFilter && (
                    <p className="text-xs text-muted-foreground">
                      {data.jobs.length} result{data.jobs.length !== 1 ? "s" : ""}
                      {keyword && ` for "${keyword}"`}
                      {location && ` in ${location}`}
                    </p>
                  )}
                  {data.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  {data.totalJobs && data.totalJobs > data.jobs.length && (
                    <a
                      href={data.careersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      +{(data.totalJobs - data.jobs.length).toLocaleString()} more jobs →
                    </a>
                  )}
                </div>
              )}

              {/* No jobs from search */}
              {data.jobs.length === 0 && hasFilter && (
                <div className="rounded-xl bg-muted/40 p-5 text-center">
                  <p className="text-sm font-medium">No matching jobs found</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or clear the filter</p>
                  <button onClick={clearSearch} className="mt-3 text-xs text-red-600 hover:underline">
                    Show all jobs
                  </button>
                </div>
              )}

              {/* Employer's Live Job Portal — shown when no indexed listings are found */}
              {data.jobs.length === 0 && !hasFilter && (
                <div className="rounded-2xl border border-red-100 bg-gradient-to-b from-red-50/60 to-white p-6 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-600/10">
                    <ExternalLink className="size-5 text-red-600" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    Employer&apos;s Live Job Portal
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Explore {data.companyName}&apos;s official careers page to view the latest opportunities and apply directly.
                  </p>
                  {data.careersUrl && (
                    <a
                      href={data.careersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                    >
                      {data.source === "nhs" ? "Search NHS Jobs" : "Visit Careers Page"}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
