import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy, TrendingUp, MapPin, ChevronRight, Lock, Building2,
} from "lucide-react";
import { getSponsors } from "@/lib/sponsor-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

export const metadata: Metadata = {
  title: "UK Visa Sponsor Rankings 2025 · The Sponsor Finder",
  description:
    "The top UK companies by visa sponsorship volume in 2025. Ranked by Certificates of Sponsorship issued — NHS trusts, tech giants, consultancies and more.",
};

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉", Active: "●", Inactive: "○",
};

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
      <h2 className="mb-4 font-heading text-xl font-bold">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Organisation</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">City</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">Industry</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">CoS 2025</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.map((s, i) => (
              <tr key={s.id} className="group transition-colors hover:bg-muted/30">
                <td className="px-4 py-3.5 tabular text-sm font-bold text-muted-foreground">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/sponsors/${s.id}`} className="font-medium transition-colors hover:text-red-600">
                    {s.organisationName}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                      TIER_BG[s.sponsorTier as SponsorTier]
                    )}>
                      {TIER_EMOJI[s.sponsorTier as SponsorTier]} {s.sponsorTier}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 shrink-0" /> {s.town}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 text-muted-foreground md:table-cell">
                  {s.industryCategory}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-bold tabular text-foreground">
                    {s.cos2025Total?.toLocaleString() ?? (s.cos2025SwSuppressed ? "< 5" : "—")}
                  </span>
                  {s.cos2025Gbm && s.cos2025Gbm > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (+{s.cos2025Gbm.toLocaleString()} GBM)
                    </span>
                  )}
                </td>
                <td className="px-2 py-3.5">
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paywall for ranks 11-100 */}
        {hidden.length > 0 && (
          <div className="relative border-t border-dashed border-border">
            {/* blurred preview rows */}
            <div className="pointer-events-none select-none blur-[3px]">
              {hidden.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border px-4 py-3.5 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-sm font-bold text-muted-foreground tabular">{i + 11}</span>
                    <span className="font-medium">{s.organisationName}</span>
                  </div>
                  <span className="font-bold tabular">{s.cos2025Total?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {/* Paywall overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                <Lock className="size-4 text-red-600" />
                <span className="text-sm font-medium">
                  {hidden.length} more sponsors visible with{" "}
                  <Link href="/pricing" className="font-semibold text-red-600 hover:underline">Pro</Link>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Full Top 100 rankings, Strength & Opportunity scores
              </p>
            </div>
          </div>
        )}
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
        <div className="flex items-center justify-center gap-2">
          <Trophy className="size-6 text-amber-500" />
          <p className="eyebrow">2025 Data</p>
        </div>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
          UK Visa Sponsor Rankings
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
          Ranked by Certificates of Sponsorship issued in 2025. Source: Home Office FOI
          data — the most authoritative hiring signal available.
        </p>

        {/* Headline stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: "Sponsors Ranked", value: withCos.length.toLocaleString() },
            { label: "Total 2025 CoS", value: totalCos.toLocaleString() },
            { label: "Platinum Tier", value: platinumCount.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-2xl font-bold tabular">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
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
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
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
      <div className="mt-16 rounded-3xl border border-red-600/20 bg-red-600/5 p-8 text-center">
        <Building2 className="mx-auto size-8 text-red-600" />
        <h2 className="mt-3 font-heading text-xl font-bold">Want the full Top 100?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Pro users see complete rankings for every category, plus Strength Scores,
          Opportunity Scores, and custom alerts when top sponsors post new jobs.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Pro
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/20"
          >
            <TrendingUp className="size-4" /> Browse all sponsors
          </Link>
        </div>
      </div>
    </div>
  );
}
