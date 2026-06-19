"use client";

import Link from "next/link";
import { Heart, Lock, MapPin, Zap, Flame, TrendingUp, Activity, Briefcase, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useSaved } from "@/hooks/use-saved";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { hiringBand, type Sponsor } from "@/lib/types";

const HIRING_STYLES: Record<string, { badge: "emerald" | "amber" | "default"; icon: React.ReactNode }> = {
  High: { badge: "emerald", icon: <Flame className="size-3.5" /> },
  Medium: { badge: "amber", icon: <TrendingUp className="size-3.5" /> },
  Low: { badge: "default", icon: <Activity className="size-3.5" /> },
};

export function SponsorCard({ sponsor, isPro = false }: { sponsor: Sponsor; isPro?: boolean }) {
  const { isSaved, toggle } = useSaved();
  const { toast } = useToast();
  const saved = isSaved(sponsor.id);
  const band = hiringBand(sponsor.hiringLikelihoodScore);
  const hs = HIRING_STYLES[band];

  const handleSave = () => {
    const nowSaved = toggle(sponsor.id);
    toast(nowSaved ? `Saved ${sponsor.organisationName}` : `Removed ${sponsor.organisationName}`, nowSaved ? "success" : "info");
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-red-600/40 hover:shadow-xl hover:shadow-red-600/5">
      {/* Gradient top accent revealed on hover */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="cyan">{sponsor.industryCategory}</Badge>
        {sponsor.rating === "A-rated" ? (
          <Badge variant="emerald">
            <ShieldCheck className="size-3.5" /> A-rated
          </Badge>
        ) : (
          <Badge variant="amber">
            <ShieldAlert className="size-3.5" /> B-rated
          </Badge>
        )}
      </div>

      {/* Name + location */}
      <div className="mt-4">
        <Link
          href={`/sponsors/${sponsor.id}`}
          className="font-heading text-base font-semibold tracking-tight transition-colors hover:text-red-600"
        >
          {sponsor.organisationName}
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" /> {sponsor.town}, {sponsor.county}
        </p>
      </div>

      {/* Metric tiles */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="eyebrow">Hiring</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            <Badge variant={hs.badge} className="px-2 py-0.5">
              {hs.icon} {band}
            </Badge>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="eyebrow">CoS 2025</p>
          <p className="mt-1 text-sm font-semibold tabular">{sponsor.cosActivity2025} issued</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Route: <span className="text-foreground">{sponsor.route}</span> · Size:{" "}
        <span className="text-foreground">{sponsor.companySize}</span>
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
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
            "grid size-9 place-items-center rounded-md border border-border transition-all hover:border-red-600/50",
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
          className="grid size-9 place-items-center rounded-md border border-border text-zinc-700 transition-colors hover:border-zinc-700/50 hover:bg-zinc-900/10"
        >
          <Zap className="size-4" />
        </Link>
      </div>

      {/* Pro features */}
      <div className="relative mt-4 border-t border-dashed border-border pt-4">
        <div className={cn("space-y-1 text-xs", !isPro && "pointer-events-none select-none blur-[5px]")}>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="size-3.5" /> Live jobs:{" "}
            <span className="font-semibold text-foreground">{sponsor.liveJobsCount}</span>
          </p>
          <p className="text-muted-foreground">
            Suggested roles:{" "}
            <span className="font-semibold text-foreground">{sponsor.suggestedSocCodes.length}</span> · Score{" "}
            <span className="font-semibold text-red-600">{sponsor.hiringLikelihoodScore}/100</span>
          </p>
        </div>
        {!isPro && (
          <Link
            href="/pricing"
            className="absolute inset-0 flex animate-pulse-soft items-center justify-center gap-1.5 text-xs font-medium text-red-600"
          >
            <Lock className="size-3.5" /> Upgrade to see full insights
          </Link>
        )}
      </div>
    </div>
  );
}
