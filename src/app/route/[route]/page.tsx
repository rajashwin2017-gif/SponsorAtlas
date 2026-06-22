import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Globe, MapPin } from "lucide-react";
import { getRouteStats, getSponsors } from "@/lib/sponsor-store";
import { cn } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉", Active: "●", Inactive: "○",
};

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "skilled-worker": "The main UK work visa for skilled professionals. Requires a job offer from a licensed sponsor paying at least the going rate for the SOC code.",
  "global-business-mobility-senior-or-specialist-worker": "For overseas employees of multinational companies coming to work in a UK branch. Requires at least 12 months' employment with the overseas employer.",
  "global-business-mobility-graduate-trainee": "For employees on a structured graduate training programme who are transferred to the UK. Salary minimum applies.",
  "scale-up": "For highly skilled workers joining a fast-growing UK business. Offers more flexibility — workers can switch employers after 6 months.",
  "health-care-worker": "A dedicated route for health and social care workers, including nurses, doctors and care assistants. Lower salary thresholds apply.",
  "creative-worker": "For creative professionals including performers, artists and entertainers working in the UK for short periods.",
  "charity-worker": "For unpaid volunteers working for a charity registered in the UK.",
};

export async function generateStaticParams() {
  return getRouteStats().map((r) => ({ route: r.slug }));
}

export function generateMetadata({ params }: { params: { route: string } }): Metadata {
  const routeData = getRouteStats().find((r) => r.slug === params.route);
  if (!routeData) return { title: "Route not found" };
  return {
    title: `${routeData.route} Visa Sponsors UK 2025 · SponsorAtlas`,
    description: `${routeData.totalSponsors.toLocaleString()} UK employers licensed to sponsor the ${routeData.route} visa. Find the top hiring companies by 2025 CoS volume.`,
  };
}

export default function RoutePage({ params }: { params: { route: string } }) {
  const routeData = getRouteStats().find((r) => r.slug === params.route);
  if (!routeData) notFound();

  const sponsors = getSponsors()
    .filter((s) => s.routes.some((r) => {
      const slug = r.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return slug === params.route || slug.includes(params.route.split("-")[0]);
    }))
    .filter((s) => s.sponsorTier !== "Inactive")
    .sort((a, b) => (b.cos2025Total ?? 0) - (a.cos2025Total ?? 0))
    .slice(0, 15);

  const description = ROUTE_DESCRIPTIONS[params.route];

  return (
    <div className="container py-10 sm:py-14">
      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to search
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-red-600" />
          <p className="eyebrow">Visa Route</p>
        </div>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          {routeData.route}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>
        )}
        <p className="mt-3 text-muted-foreground">
          <span className="font-semibold text-foreground">{routeData.totalSponsors.toLocaleString()}</span> licensed sponsors ·{" "}
          <span className="font-semibold text-foreground">{routeData.cos2025Total.toLocaleString()}</span> CoS issued in 2025
        </p>
      </header>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Licensed Sponsors", value: routeData.totalSponsors.toLocaleString() },
          { label: "2025 CoS Issued", value: routeData.cos2025Total.toLocaleString() },
          { label: "Top City", value: routeData.topCities[0]?.city ?? "London" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold tabular">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Top sponsors table */}
        <div>
          <h2 className="mb-4 font-heading text-xl font-bold">
            Top {routeData.route} Sponsors by 2025 CoS
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Organisation</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">City</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">CoS 2025</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sponsors.map((s, i) => (
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
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      <Link href={`/city/${s.town.toLowerCase()}`} className="flex items-center gap-1 hover:text-red-600">
                        <MapPin className="size-3" /> {s.town}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular">
                      {s.cos2025Total?.toLocaleString() ?? "< 5"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              href={`/search?route=${encodeURIComponent(routeData.route)}&sort=cos`}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
            >
              View all {routeData.totalSponsors.toLocaleString()} sponsors <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Sidebar — top cities */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">Top Cities for this Route</h3>
            <div className="mt-3 space-y-1">
              {routeData.topCities.map((c) => (
                <Link
                  key={c.city}
                  href={`/city/${encodeURIComponent(c.city.toLowerCase())}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-muted-foreground" />{c.city}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">{c.count.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">All Visa Routes</h3>
            <div className="mt-3 space-y-1">
              {getRouteStats()
                .filter((r) => r.slug !== params.route)
                .slice(0, 8)
                .map((r) => (
                  <Link
                    key={r.slug}
                    href={`/route/${r.slug}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                  >
                    <span className="text-muted-foreground">{r.route}</span>
                    <span className="font-semibold tabular">{r.totalSponsors.toLocaleString()}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
