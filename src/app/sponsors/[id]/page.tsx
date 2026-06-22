import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin, ShieldCheck, ShieldAlert, Flame, TrendingUp, Activity,
  Building2, Hash, CalendarClock, ArrowLeft, Banknote, ChevronRight,
  Dot, Globe, Trophy, Target, Lock,
} from "lucide-react";
import { getSponsors, getSponsorById, getSimilarSponsors } from "@/lib/sponsor-store";
import { SOC_CODES } from "@/lib/soc-data";
import { LiveJobs } from "@/components/live-jobs";
import { CosChartLazy } from "@/components/cos-chart-lazy";
import { FitWidget } from "@/components/fit-widget";
import { SponsorActions } from "@/components/sponsor-actions";
import { Badge } from "@/components/ui/badge";
import { cn, formatGBP, timeAgo } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉", Active: "●", Inactive: "○",
};

export function generateStaticParams() {
  // Pre-render top 500 sponsors; the rest are generated on-demand
  return getSponsors()
    .slice(0, 500)
    .map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = getSponsorById(params.id);
  if (!s) return { title: "Sponsor not found" };
  const cosText = s.cos2025Total ? ` Issued ${s.cos2025Total.toLocaleString()} CoS in 2025.` : "";
  return {
    title: `${s.organisationName} · UK Visa Sponsor`,
    description: `${s.organisationName} in ${s.town} is a ${s.rating}-rated ${s.sponsorTier} tier ${s.route} sponsor.${cosText} View hiring intelligence, Strength Score and similar sponsors.`,
  };
}

function ScoreMeter({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span className={cn("font-bold", color)}>{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, hint }: { label: string; value: string; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-1.5 font-heading text-lg font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</dt>
      <dd className="tabular font-medium">{value}</dd>
    </div>
  );
}

export default function SponsorDetailPage({ params }: { params: { id: string } }) {
  const sponsor = getSponsorById(params.id);
  if (!sponsor) notFound();

  const similar = getSimilarSponsors(sponsor, 4);
  const suggestedSoc = (sponsor.suggestedSocCodes ?? [])
    .map((c) => SOC_CODES.find((s) => s.socCode === c))
    .filter(Boolean);

  const tier = (sponsor.sponsorTier ?? "Active") as SponsorTier;
  const activity = sponsor.hiringActivity ?? "Low";
  const ActivityIcon = activity === "Very High" || activity === "High" ? Flame : activity === "Medium" ? TrendingUp : Activity;

  const cosDisplay = sponsor.cos2025Total
    ? sponsor.cos2025Total.toLocaleString()
    : (sponsor.cos2025SwSuppressed || sponsor.cos2025GbmSuppressed)
    ? "< 5"
    : "No data";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: sponsor.organisationName,
    address: {
      "@type": "PostalAddress",
      addressLocality: sponsor.town,
      addressRegion: sponsor.county,
      addressCountry: "GB",
    },
  };

  return (
    <div className="container py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to search
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">{sponsor.industryCategory}</Badge>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                TIER_BG[tier]
              )}>
                {TIER_EMOJI[tier]} {tier} Tier
              </span>
              {sponsor.rating === "A" ? (
                <Badge variant="emerald"><ShieldCheck className="size-3.5" /> A-rated</Badge>
              ) : (
                <Badge variant="amber"><ShieldAlert className="size-3.5" /> {sponsor.rating}-rated</Badge>
              )}
              <Badge variant={sponsor.licenceStatus === "Active" ? "cyan" : "rose"}>
                {sponsor.licenceStatus}
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl tracking-tight">{sponsor.organisationName}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              <Link href={`/city/${sponsor.town.toLowerCase()}`} className="hover:text-red-600">
                {sponsor.town}{sponsor.county ? `, ${sponsor.county}` : ""}
              </Link>
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Activity" value={activity} icon={<ActivityIcon className="size-4" />} hint="2025 hiring" />
            <MetricCard label="CoS 2025" value={cosDisplay} icon={<TrendingUp className="size-4" />} hint="total issued" />
            <MetricCard label="Visa Routes" value={`${(sponsor.routes ?? []).length}`} icon={<Globe className="size-4" />} hint="licenced" />
            <MetricCard label="Tier" value={tier} icon={<Trophy className="size-4" />} hint={sponsor.rating + "-rated"} />
          </div>

          {/* Intelligence scores */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold">Sponsor Intelligence Scores</h2>
              <Badge variant="cyan" className="text-[10px]">Pro</Badge>
            </div>
            <div className="space-y-4">
              <ScoreMeter score={sponsor.sponsorStrengthScore} label="Sponsor Strength Score" color="text-emerald-600" />
              <ScoreMeter score={sponsor.opportunityScore} label="Opportunity Score" color="text-red-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold text-foreground mb-1">Strength factors</p>
                <p>A/B rating · CoS volume · Route breadth · GBM activity</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold text-foreground mb-1">Opportunity factors</p>
                <p>CoS volume · City demand · Route breadth · Tier</p>
              </div>
            </div>
          </div>

          {/* CoS breakdown */}
          <div className="surface-card p-5">
            <h2 className="font-heading text-base font-semibold">2025 CoS Breakdown</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Certificates of Sponsorship issued Jan–Dec 2025 · Source: Home Office FOI 2026/03173
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Skilled Worker</p>
                <p className="font-display text-2xl font-bold tabular">
                  {sponsor.cos2025Sw?.toLocaleString() ?? (sponsor.cos2025SwSuppressed ? "< 5" : "—")}
                </p>
                {sponsor.cos2025SwSuppressed && (
                  <p className="text-xs text-muted-foreground mt-1">Suppressed by Home Office (1–4 CoS)</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Global Business Mobility</p>
                <p className="font-display text-2xl font-bold tabular">
                  {sponsor.cos2025Gbm?.toLocaleString() ?? (sponsor.cos2025GbmSuppressed ? "< 5" : "—")}
                </p>
                {sponsor.cos2025GbmSuppressed && (
                  <p className="text-xs text-muted-foreground mt-1">Suppressed by Home Office (1–4 CoS)</p>
                )}
              </div>
            </div>
            {/* Legacy chart for visual continuity */}
            {sponsor.cosActivity2025 > 0 && (
              <div className="mt-5">
                <CosChartLazy sponsor={sponsor} />
              </div>
            )}
          </div>

          {/* Live Jobs — Pro users see real listings, free users see paywall */}
          <LiveJobs
            sponsorId={sponsor.id}
            companyName={sponsor.organisationName}
            isPro={true}
          />

          {/* Visa routes held */}
          {(sponsor.routes ?? []).length > 0 && (
            <div className="surface-card p-5">
              <h2 className="font-heading text-base font-semibold">Visa Routes Licensed</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(sponsor.routes ?? [sponsor.route]).map((r) => (
                  <Link
                    key={r}
                    href={`/route/${r.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
                  >
                    <Globe className="size-3" /> {r}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggested roles */}
          {suggestedSoc.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="font-heading text-base font-semibold">Suggested Roles to Target</h2>
              <p className="mb-3 text-xs text-muted-foreground">SOC codes aligned to this sponsor&apos;s hiring patterns</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestedSoc.map((soc) => (
                  <Link
                    key={soc!.socCode}
                    href={`/soc-codes?q=${soc!.socCode}`}
                    className="rounded-lg border border-border bg-surface/50 p-3 transition-colors hover:border-zinc-900/40"
                  >
                    <p className="font-mono text-xs text-zinc-700">SOC {soc!.socCode}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium">{soc!.occupationTitle}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Banknote className="size-3.5" /> {formatGBP(soc!.goingRate2026)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Similar sponsors */}
          {similar.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="font-heading text-base font-semibold">Similar Sponsors</h2>
              <p className="mb-3 text-xs text-muted-foreground">Same industry or city · ranked by opportunity score</p>
              <ul className="divide-y divide-border">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sponsors/${s.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-red-600"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.organisationName}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.town} · {s.industryCategory} ·{" "}
                          {s.cos2025Total ? `${s.cos2025Total.toLocaleString()} CoS` : s.hiringActivity}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-semibold",
                          s.opportunityScore >= 70 ? "text-emerald-600" : s.opportunityScore >= 40 ? "text-amber-600" : "text-zinc-400"
                        )}>
                          {s.opportunityScore}/100
                        </span>
                        <ChevronRight className="size-4" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right column (sticky) ── */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FitWidget sponsorId={sponsor.id} industry={sponsor.industryCategory} />
          <SponsorActions sponsorId={sponsor.id} name={sponsor.organisationName} />

          <div className="surface-card p-5">
            <h2 className="font-heading text-sm font-semibold">Quick Facts</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {sponsor.companiesHouseNumber && (
                <Fact icon={<Hash className="size-3.5" />} label="Companies House" value={sponsor.companiesHouseNumber} />
              )}
              {sponsor.sicCode && (
                <Fact icon={<Hash className="size-3.5" />} label="SIC code" value={sponsor.sicCode} />
              )}
              <Fact
                icon={<CalendarClock className="size-3.5" />}
                label="On register since"
                value={new Date(sponsor.addedDate).toLocaleDateString("en-GB", { year: "numeric", month: "short" })}
              />
              <Fact
                icon={<Target className="size-3.5" />}
                label="Opportunity score"
                value={`${sponsor.opportunityScore}/100`}
              />
              <Fact
                icon={<TrendingUp className="size-3.5" />}
                label="Strength score"
                value={`${sponsor.sponsorStrengthScore}/100`}
              />
            </dl>
          </div>

          {/* Rankings link */}
          <Link
            href="/sponsors/rankings"
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300"
          >
            <div>
              <p className="text-sm font-semibold text-amber-900">UK Sponsor Rankings</p>
              <p className="text-xs text-amber-700">See how this sponsor compares to the top 100</p>
            </div>
            <ChevronRight className="size-4 text-amber-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
