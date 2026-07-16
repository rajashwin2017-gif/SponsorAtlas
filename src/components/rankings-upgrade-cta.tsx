"use client";

import Link from "next/link";
import { Building2, TrendingUp } from "lucide-react";
import { useTier } from "@/hooks/use-tier";

// Shown only to free users at the bottom of the Rankings page.
export function RankingsUpgradeCta() {
  const { isPro, loading } = useTier();

  // Hide while loading and for paid users.
  if (loading || isPro) return null;

  return (
    <div className="mt-16 overflow-hidden rounded-3xl border border-red-600/20 bg-red-600/5 p-10 text-center sm:p-14">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-600/10 text-red-600">
        <Building2 className="size-6" />
      </div>
      <p className="eyebrow mt-5 text-red-600">Unlock more</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Want the full Top 100?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Pro users see complete rankings for every category, plus Strength Scores,
        Opportunity Scores, and custom alerts when top sponsors post new jobs.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-opacity hover:opacity-90"
        >
          Upgrade to Pro
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-1.5 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/20"
        >
          <TrendingUp className="size-4" /> Browse all sponsors
        </Link>
      </div>
    </div>
  );
}
