"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, MapPin, ExternalLink, Loader2, Lock,
  Building2, ChevronRight, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobsResponse, JobListing } from "@/app/api/jobs/[sponsorId]/route";

interface LiveJobsProps {
  sponsorId: string;
  companyName: string;
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

function SourceBadge({ source }: { source: JobsResponse["source"] }) {
  const map: Record<string, { label: string; color: string }> = {
    greenhouse: { label: "Greenhouse ATS", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    lever:      { label: "Lever ATS",      color: "bg-blue-50 text-blue-700 border-blue-200" },
    nhs:        { label: "NHS Jobs",        color: "bg-violet-50 text-violet-700 border-violet-200" },
    url:        { label: "Careers Page",   color: "bg-gray-50 text-gray-600 border-gray-200" },
    none:       { label: "Web Search",     color: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const m = map[source] ?? map.none;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", m.color)}>
      {m.label}
    </span>
  );
}

function JobCard({ job }: { job: JobListing }) {
  return (
    <a
      href={job.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-red-300 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug group-hover:text-red-600">
          {job.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {job.location}
            </span>
          )}
          {job.department && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />
              {job.department}
            </span>
          )}
          {job.postedAt && (
            <span>{timeAgo(job.postedAt)}</span>
          )}
        </div>
        {job.employmentType && (
          <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {job.employmentType}
          </span>
        )}
      </div>
      <div className="shrink-0">
        <span className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-red-700">
          Apply <ExternalLink className="size-3" />
        </span>
      </div>
    </a>
  );
}

function ProGate({ companyName }: { companyName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none space-y-3 p-4 blur-[3px]">
        {[
          { title: "Senior Software Engineer", location: "London, UK", dept: "Engineering" },
          { title: "Product Manager", location: "Remote (UK)", dept: "Product" },
          { title: "Data Scientist", location: "Manchester, UK", dept: "Data" },
        ].map((j) => (
          <div key={j.title} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-semibold">{j.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{j.location} · {j.dept}</p>
            </div>
            <span className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Apply</span>
          </div>
        ))}
      </div>
      {/* Overlay */}
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

export function LiveJobs({ sponsorId, companyName, isPro = false }: LiveJobsProps) {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isPro) return;
    setLoading(true);
    fetch(`/api/jobs/${sponsorId}`)
      .then((r) => r.json())
      .then((d: JobsResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [sponsorId, isPro]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
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
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            View all jobs <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {!isPro && <ProGate companyName={companyName} />}

      {isPro && loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Fetching live jobs…</span>
        </div>
      )}

      {isPro && error && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          Unable to load jobs right now. Try again later.
        </div>
      )}

      {isPro && data && !loading && (
        <>
          {/* Has live job listings (Greenhouse / Lever) */}
          {data.jobs.length > 0 && (
            <div className="space-y-3">
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
                  +{data.totalJobs - data.jobs.length} more jobs on {data.source === "greenhouse" ? "Greenhouse" : "Lever"}
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}

          {/* NHS / direct URL — no job listings, just a link */}
          {data.jobs.length === 0 && data.careersUrl && (
            <a
              href={data.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-red-300 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-red-50">
                  <Briefcase className="size-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Browse open roles at {data.companyName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.source === "nhs"
                      ? "Opens NHS Jobs — the official NHS recruitment portal"
                      : "Opens the company's official careers page"}
                  </p>
                </div>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            </a>
          )}

          {/* No careers data at all */}
          {data.jobs.length === 0 && !data.careersUrl && (
            <p className="text-sm text-muted-foreground py-2">
              No careers portal found for this organisation.
            </p>
          )}
        </>
      )}
    </section>
  );
}
