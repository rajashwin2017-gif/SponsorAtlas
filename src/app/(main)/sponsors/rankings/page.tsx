import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy, TrendingUp, MapPin, ChevronRight, Building2,
} from "lucide-react";
import { getSponsors } from "@/lib/sponsor-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";
import { BlurGate } from "@/components/tier-gate";
import { RankingHiddenRows } from "@/components/rankings-hidden-rows";

export const metadata: Metadata = {
  title: "UK Visa Sponsor Rankings 2025 · The Sponsor Finder",
  description:
    "The top UK companies by visa sponsorship volume in 2025. Ranked by Certificates of Sponsorship issued — NHS trusts, tech giants, consultancies and more.",
};

const TIER_ICON: Record<SponsorTier, string> = {
  Platinum: "◆", Gold: "▲", Silver: "■", Bronze: "●", Active: "●", Inactive: "○",
};

const RANK_MEDALS = ["#1", "#2", "#3"] as const;

const CATEGORIES = [
  { key: "all",          label: "All Sectors",    filter: () => true },
  { key: "healthcare",   label: "NHS & Healthcare", filter: (i: string) => i === "Healthcare" },
  { key: "technology",   label: "Technology",      filter: (i: string) => i === "Technology" },
  { key: "consulting",   label: "Consulting",      filter: (i: string) => i === "Consulting" },
  { key: "finance",      label: "Finance",         filter: (i: string) => i === "Finance" },
  { key: "education",    label: "Education",       filter: (i: string) => i === "Education" },
  { key: "life-sciences",label: "Life Sciences",   filter: (i: string) => i === "Life Sciences" },
] as const;

function RankingTable({
  title,
  sponsors,
  showAll = false,
}: {
  title: string;
  sponsors: ReturnType<typeof getSponsors>;
  showAll?: boolean;
}) {
  const displayed = showAll ? sponsors : sponsors.slice(0, 10);
  const hidden = sponsors.slice(10, 100);

  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-14 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">#</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Organisation</th>
              <th className="hidden px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:table-cell">City</th>
              <th className="hidden px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground md:table-cell">Industry</th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">CoS 2025</th>
              <th className="w-8 px-2 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.map((s, i) => (
              <tr key={s.id} className="group cursor-pointer transition-colors hover:bg-muted/30">
                <td className="px-4 py-4 tabular">
                  {i < 3 ? (
                    <span className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                      i === 0 && "bg-amber-100 text-amber-700",
                      i === 1 && "bg-zinc-100 text-zinc-600",
                      i === 2 && "bg-orange-100 text-orange-700",
                    )}>{RANK_MEDALS[i]}</span>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <Link href={`/sponsors/${s.id}`} className="font-heading text-sm font-semibold leading-snug transition-colors hover:text-red-600">
                    {s.organisationName}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5">
                    <BlurGate compact iconOnly className="rounded-full">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                        TIER_BG[s.sponsorTier as SponsorTier]
                      )}>
                        <span className="text-[8px]" aria-hidden="true">{TIER_ICON[s.sponsorTier as SponsorTier]}</span>
                        {s.sponsorTier}
                      </span>
                    </BlurGate>
                  </div>
                </td>
                <td className="hidden px-4 py-4 text-sm text-muted-foreground sm:table-cell">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" /> {s.town}
                  </span>
                </td>
                <td className="hidden px-4 py-4 text-sm text-muted-foreground md:table-cell">
                  {s.industryCategory}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold tabular text-foreground">
                    {s.cos2025Total?.toLocaleString() ?? (s.cos2025SwSuppressed ? "< 5" : "—")}
                  </span>
                  {s.cos2025Gbm && s.cos2025Gbm > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      +{s.cos2025Gbm.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-2 py-4">
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rows 11+ — full list for Pro, blurred teaser + paywall for Free */}
        <RankingHiddenRows sponsors={hidden} />
      </div>
    </div>
  );
}

export default function RankingsPage() {
  const allSponsors = getSponsors();

  // Top by total CoS (only those with numeric data)
  const withCos = allSponsors
    .filter((s) => s.cos2025Total && s.cos2025Total > 0)
    .sort((a, b) => (b.cos2025Total ?? 0) - (a.cos2025Total ?? 0));

  // Category tables
  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    sponsors: withCos.filter((s) => cat.filter(s.industryCategory)).slice(0, 15),
  }));

  // Platform stats
  const totalCos = withCos.reduce((sum, s) => sum + (s.cos2025Total ?? 0), 0);
  const platinumCount = withCos.filter((s) => s.sponsorTier === "Platinum").length;

  return (
    <div className="container py-10 sm:py-14">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <p className="eyebrow text-red-600">2025 Home Office Data</p>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          UK Visa Sponsor Rankings
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          Ranked by Certificates of Sponsorship issued in 2025. Source: Home Office FOI
          data — the most authoritative hiring signal available.
        </p>

        {/* Headline stats */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { label: "Sponsors Ranked", value: withCos.length.toLocaleString() },
            { label: "Total 2025 CoS", value: totalCos.toLocaleString() },
            { label: "Platinum Tier", value: platinumCount.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="glass p-5 text-center">
              <p className="font-display text-3xl font-semibold tabular sm:text-4xl">{s.value}</p>
              <p className="eyebrow mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Category quick-links */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.key}
            href={`#${cat.key}`}
            className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
          >
            {cat.label}
          </a>
        ))}
      </div>

      {/* Tables */}
      <div className="mt-12 space-y-16">
        {byCategory.map((cat) => (
          <section key={cat.key} id={cat.key}>
            <RankingTable
              title={`Top ${cat.label} Sponsors by 2025 CoS`}
              sponsors={cat.sponsors}
              showAll={true}
            />
          </section>
        ))}
      </div>

      {/* Intelligence CTA */}
      <div className="mt-16 overflow-hidden rounded-3xl border border-red-600/20 bg-red-600/5 p-10 text-center sm:p-14">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-600/10 text-red-600">
          <Building2 className="size-6" />
        </div>
        <p className="eyebrow mt-5 text-red-600">Unlock more</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Want the full Top 100?</h2>
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
    </div>
  );
}
