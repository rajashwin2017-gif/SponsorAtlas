"use client";

import Link from "next/link";
import { Heart, Lock, MapPin, Zap, Briefcase, ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useSaved } from "@/hooks/use-saved";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { hiringBand, type Sponsor } from "@/lib/types";

const BAND_DOT: Record<string, string> = {
  High: "bg-emerald-500",
  Medium: "bg-amber-500",
  Low: "bg-zinc-400",
};

export function SponsorCard({ sponsor, isPro = false }: { sponsor: Sponsor; isPro?: boolean }) {
  const { isSaved, toggle } = useSaved();
  const { toast } = useToast();
  const saved = isSaved(sponsor.id);
  const band = hiringBand(sponsor.hiringLikelihoodScore);

  const handleSave = () => {
    const nowSaved = toggle(sponsor.id);
    toast(
      nowSaved ? `Saved ${sponsor.organisationName}` : `Removed ${sponsor.organisationName}`,
      nowSaved ? "success" : "info"
    );
  };

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)]">
      {/* hairline accent revealed on hover */}
      <span
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* meta row */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {sponsor.industryCategory}
        </span>
        {sponsor.rating === "A-rated" ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
            <ShieldCheck className="size-3.5" /> A-rated
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
            <ShieldAlert className="size-3.5" /> B-rated
          </span>
        )}
      </div>

      {/* name + location */}
      <div className="mt-3">
        <Link
          href={`/sponsors/${sponsor.id}`}
          className="inline-flex items-start gap-1 font-heading text-[15px] font-semibold leading-snug tracking-tight transition-colors hover:text-red-600"
        >
          {sponsor.organisationName}
          <ArrowUpRight className="mt-px size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> {sponsor.town}, {sponsor.county}
        </p>
      </div>

      {/* stats — hairline separated, no boxes */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <p className="eyebrow">Hiring</p>
          <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
            <span className={cn("size-2 rounded-full", BAND_DOT[band])} aria-hidden="true" /> {band}
          </p>
        </div>
        <div>
          <p className="eyebrow">CoS 2025</p>
          <p className="mt-1.5 text-sm font-semibold tabular">{sponsor.cosActivity2025.toLocaleString()}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {sponsor.route} · {sponsor.companySize}
      </p>

      {/* actions */}
      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link
          href={`/sponsors/${sponsor.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
        >
          View details
        </Link>
        <button
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save sponsor"}
          className={cn(
            "grid size-9 place-items-center rounded-lg border border-border transition-colors hover:border-red-600/50",
            saved && "border-red-600/50 bg-red-600/10"
          )}
        >
          <Heart
            className={cn(
              "size-4 transition-all duration-200",
              saved ? "scale-110 fill-red-600 text-red-600" : "text-muted-foreground"
            )}
          />
        </button>
        <Link
          href={`/sponsors/${sponsor.id}#fit`}
          aria-label="Run Fit Check"
          className="grid size-9 place-items-center rounded-lg border border-border text-zinc-700 transition-colors hover:border-zinc-700/50 hover:bg-zinc-900/5"
        >
          <Zap className="size-4" />
        </Link>
      </div>

      {/* pro insights */}
      <div className="relative mt-4 border-t border-dashed border-border pt-4">
        <div
          className={cn(
            "flex items-center justify-between text-xs text-muted-foreground",
            !isPro && "pointer-events-none select-none blur-[5px]"
          )}
        >
          <span className="flex items-center gap-1.5">
            <Briefcase className="size-3.5" /> {sponsor.liveJobsCount} live jobs
          </span>
          <span>
            Score <span className="font-semibold text-red-600">{sponsor.hiringLikelihoodScore}</span>/100
          </span>
        </div>
        {!isPro && (
          <Link
            href="/pricing"
            className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600"
          >
            <Lock className="size-3.5" /> Upgrade for insights
          </Link>
        )}
      </div>
    </div>
  );
}
