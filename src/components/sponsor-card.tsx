"use client";

import Link from "next/link";
import {
  Heart, Lock, MapPin, Zap, Briefcase, ShieldCheck, ShieldAlert,
  ArrowUpRight, TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useSaved } from "@/hooks/use-saved";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  type Sponsor, type SponsorTier, TIER_BG, ACTIVITY_DOT,
} from "@/lib/types";

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆",
  Gold: "🥇",
  Silver: "🥈",
  Bronze: "🥉",
  Active: "●",
  Inactive: "○",
};

function formatCos(sponsor: Sponsor): string {
  const total = sponsor.cos2025Total;
  const supp = sponsor.cos2025SwSuppressed || sponsor.cos2025GbmSuppressed;
  if (!total && !supp) return "—";
  if (!total && supp) return "< 5";
  return total!.toLocaleString();
}

export function SponsorCard({ sponsor, isPro = false }: { sponsor: Sponsor; isPro?: boolean }) {
  const { isSaved, toggle } = useSaved();
  const { toast } = useToast();
  const saved = isSaved(sponsor.id);

  const tier = sponsor.sponsorTier ?? "Inactive";
  const activity = sponsor.hiringActivity ?? "Inactive";
  const dotClass = ACTIVITY_DOT[activity as keyof typeof ACTIVITY_DOT] ?? "bg-zinc-300";

  const handleSave = () => {
    const nowSaved = toggle(sponsor.id);
    toast(
      nowSaved ? `Saved ${sponsor.organisationName}` : `Removed ${sponsor.organisationName}`,
      nowSaved ? "success" : "info"
    );
  };

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)]">
      {/* Hover accent */}
      <span
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {sponsor.industryCategory}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tier badge */}
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              TIER_BG[tier as SponsorTier] ?? "bg-zinc-50 text-zinc-500 border-zinc-200"
            )}
          >
            {TIER_EMOJI[tier as SponsorTier]} {tier}
          </span>
          {/* Rating */}
          {sponsor.rating === "A" ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
              <ShieldCheck className="size-3.5" /> A
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
              <ShieldAlert className="size-3.5" /> {sponsor.rating}
            </span>
          )}
        </div>
      </div>

      {/* Name + location */}
      <div className="mt-3">
        <Link
          href={`/sponsors/${sponsor.id}`}
          className="inline-flex items-start gap-1 font-heading text-[15px] font-semibold leading-snug tracking-tight transition-colors hover:text-red-600"
        >
          {sponsor.organisationName}
          <ArrowUpRight className="mt-px size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {sponsor.town}{sponsor.county ? `, ${sponsor.county}` : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <p className="eyebrow">Activity</p>
          <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
            <span className={cn("size-2 rounded-full", dotClass)} aria-hidden="true" />
            {activity}
          </p>
        </div>
        <div>
          <p className="eyebrow">CoS 2025</p>
          <p className="mt-1.5 text-sm font-semibold tabular">
            {isPro ? formatCos(sponsor) : (
              sponsor.cos2025Total
                ? <span className="blur-[4px] select-none">{sponsor.cos2025Total}</span>
                : formatCos(sponsor)
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground line-clamp-1">
        {(sponsor.routes ?? [sponsor.route]).slice(0, 2).join(" · ")}
        {(sponsor.routes ?? []).length > 2 && ` +${sponsor.routes.length - 2}`}
      </p>

      {/* Actions */}
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

      {/* Pro insights */}
      <div className="relative mt-4 border-t border-dashed border-border pt-4">
        <div
          className={cn(
            "flex items-center justify-between text-xs text-muted-foreground",
            !isPro && "pointer-events-none select-none blur-[5px]"
          )}
        >
          <span className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5" />
            Strength <span className="font-semibold text-foreground">{sponsor.sponsorStrengthScore}</span>/100
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            Opp. <span className="font-semibold text-red-600">{sponsor.opportunityScore}</span>/100
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
