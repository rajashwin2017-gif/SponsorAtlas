import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getSponsors } from "@/lib/sponsor-store";
import { RankingTableRows } from "@/components/rankings-table-rows";
import { RankingsUpgradeCta } from "@/components/rankings-upgrade-cta";

export const metadata: Metadata = {
  title: "UK Visa Sponsor Rankings 2025 · The Sponsor Finder",
  description:
    "The top UK companies by visa sponsorship volume in 2025. Ranked by Certificates of Sponsorship issued — NHS trusts, tech giants, consultancies and more.",
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
}: {
  title: string;
  sponsors: ReturnType<typeof getSponsors>;
}) {
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
            <RankingTableRows sponsors={sponsors} />
          </tbody>
        </table>
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
          Ranked by Certificates of Sponsorship issued in 2025.
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
            />
          </section>
        ))}
      </div>

      {/* Intelligence CTA — hidden for Pro/Pro+ users */}
      <RankingsUpgradeCta />
    </div>
  );
}
