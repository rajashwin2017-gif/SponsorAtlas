import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, TrendingUp, Building2, ArrowLeft, ArrowRight } from "lucide-react";
import { getCityStats, getSponsors } from "@/lib/sponsor-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉", Active: "●", Inactive: "○",
};

export async function generateStaticParams() {
  // Generate pages for the top 200 cities by sponsor count
  return getCityStats()
    .slice(0, 200)
    .map((c) => ({ city: encodeURIComponent(c.normalised) }));
}

export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const cityName = decodeURIComponent(params.city);
  const stats = getCityStats().find(
    (c) => c.normalised === cityName.toLowerCase()
  );
  const display = stats?.cityName ?? cityName;
  return {
    title: `UK Visa Sponsors in ${display} 2025 · SponsorAtlas`,
    description: `${stats?.totalSponsors.toLocaleString() ?? "Hundreds of"} licensed UK visa sponsors in ${display}. ${stats?.cos2025Total ? `${stats.cos2025Total.toLocaleString()} Certificates of Sponsorship issued in 2025.` : ""} Find the best employers to target for visa sponsorship.`,
  };
}

export default function CityPage({ params }: { params: { city: string } }) {
  const citySlug = decodeURIComponent(params.city).toLowerCase();
  const stats = getCityStats().find((c) => c.normalised === citySlug);
  if (!stats) notFound();

  const cityName = stats.cityName;
  const sponsors = getSponsors()
    .filter((s) => s.town.toLowerCase() === citySlug)
    .filter((s) => s.sponsorTier !== "Inactive")
    .sort((a, b) => (b.cos2025Total ?? 0) - (a.cos2025Total ?? 0));

  const topSponsors = sponsors.slice(0, 10);
  const platinumCount = sponsors.filter((s) => s.sponsorTier === "Platinum").length;
  const goldCount = sponsors.filter((s) => s.sponsorTier === "Gold").length;

  // Industry breakdown
  const industryMap = new Map<string, number>();
  for (const s of sponsors) {
    industryMap.set(s.industryCategory, (industryMap.get(s.industryCategory) ?? 0) + 1);
  }
  const topIndustries = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `UK Visa Sponsors in ${cityName}`,
    description: `${stats.totalSponsors} licensed UK visa sponsors in ${cityName} — ${stats.cos2025Total.toLocaleString()} CoS issued in 2025`,
    numberOfItems: stats.totalSponsors,
  };

  return (
    <div className="container py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to search
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-red-600" />
          <p className="eyebrow">{cityName}</p>
        </div>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          UK Visa Sponsors in {cityName}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {stats.totalSponsors.toLocaleString()} licensed sponsors · {stats.cos2025Total.toLocaleString()} Certificates of Sponsorship issued in 2025.
          {stats.topIndustry && ` Top sector: ${stats.topIndustry}.`}
        </p>
      </header>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Sponsors", value: stats.totalSponsors.toLocaleString() },
          { label: "2025 CoS Issued", value: stats.cos2025Total.toLocaleString() },
          { label: "Platinum Sponsors", value: platinumCount.toString() },
          { label: "Gold Sponsors", value: goldCount.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold tabular">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Top sponsors table */}
        <div>
          <h2 className="mb-4 font-heading text-xl font-bold">
            Top Sponsors in {cityName} by 2025 CoS Volume
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Organisation</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">Industry</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">CoS 2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topSponsors.map((s, i) => (
                  <tr key={s.id} className="group transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-bold text-muted-foreground tabular">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/sponsors/${s.id}`} className="font-medium hover:text-red-600">
                        {s.organisationName}
                      </Link>
                      <div className="mt-0.5">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                          TIER_BG[s.sponsorTier as SponsorTier]
                        )}>
                          {TIER_EMOJI[s.sponsorTier as SponsorTier]} {s.sponsorTier}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{s.industryCategory}</td>
                    <td className="px-4 py-3 text-right font-bold tabular">
                      {s.cos2025Total?.toLocaleString() ?? "< 5"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing top 10 of {sponsors.length.toLocaleString()} active sponsors in {cityName}
            </p>
            <Link
              href={`/search?city=${encodeURIComponent(cityName)}&sort=cos`}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Industry breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">Top Industries</h3>
            <div className="mt-3 space-y-2">
              {topIndustries.map(([industry, count]) => (
                <Link
                  key={industry}
                  href={`/search?city=${encodeURIComponent(cityName)}&industry=${encodeURIComponent(industry)}&sort=cos`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span>{industry}</span>
                  <span className="font-semibold tabular text-muted-foreground">{count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Related cities */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">Other Major Cities</h3>
            <div className="mt-3 space-y-1">
              {getCityStats()
                .filter((c) => c.normalised !== citySlug)
                .slice(0, 8)
                .map((c) => (
                  <Link
                    key={c.normalised}
                    href={`/city/${encodeURIComponent(c.normalised)}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-muted-foreground" />{c.cityName}
                    </span>
                    <span className="text-xs text-muted-foreground tabular">{c.totalSponsors.toLocaleString()}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
