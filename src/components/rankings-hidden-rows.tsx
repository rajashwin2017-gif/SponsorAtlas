"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { cn } from "@/lib/utils";
import type { Sponsor, SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_ICON: Record<SponsorTier, string> = {
  Platinum: "◆", Gold: "▲", Silver: "■", Bronze: "●", Active: "●", Inactive: "○",
};

/** Rows beyond the free top-10 preview — full list for Pro, blurred teaser + paywall for Free. */
export function RankingHiddenRows({ sponsors }: { sponsors: Sponsor[] }) {
  const { isPro } = useTier();
  if (sponsors.length === 0) return null;

  if (isPro) {
    return (
      <div className="border-t border-dashed border-border">
        {sponsors.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-0">
            <div className="flex items-center gap-4">
              <span className="w-8 text-sm font-bold text-muted-foreground tabular">{i + 11}</span>
              <div>
                <Link href={`/sponsors/${s.id}`} className="font-medium hover:text-red-600">{s.organisationName}</Link>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                    TIER_BG[s.sponsorTier as SponsorTier]
                  )}>
                    <span className="text-[8px]" aria-hidden="true">{TIER_ICON[s.sponsorTier as SponsorTier]}</span>
                    {s.sponsorTier}
                  </span>
                </div>
              </div>
            </div>
            <span className="font-bold tabular">{s.cos2025Total?.toLocaleString() ?? "—"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative border-t border-dashed border-border">
      <div className="pointer-events-none select-none blur-[3px]">
        {sponsors.slice(0, 5).map((s, i) => (
          <div key={s.id} className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-0">
            <div className="flex items-center gap-4">
              <span className="w-8 text-sm font-bold text-muted-foreground tabular">{i + 11}</span>
              <span className="font-medium">{s.organisationName}</span>
            </div>
            <span className="font-bold tabular">{s.cos2025Total?.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <Lock className="size-4 text-red-600" />
          <span className="text-sm font-medium">
            {sponsors.length} more sponsors visible with{" "}
            <Link href="/pricing" className="font-semibold text-red-600 hover:underline">Pro</Link>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Full Top 100 rankings, Strength &amp; Opportunity scores
        </p>
      </div>
    </div>
  );
}
