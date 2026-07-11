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
import { SponsorActions } from "@/components/sponsor-actions";
import { Badge } from "@/components/ui/badge";
import { cn, formatGBP, timeAgo } from "@/lib/utils";
import type { SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";
import { BlurGate } from "@/components/tier-gate";

const TIER_ICON: Record<SponsorTier, string> = {
  Platinum: "◆", Gold: "▲", Silver: "■", Bronze: "●", Active: "●", Inactive: "○",
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

function ScoreMeter({ score, label, textColor, barColor }: { score: number; label: string; textColor: string; barColor: string }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className={cn("text-lg font-bold tabular", textColor)}>{score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const ACTIVITY_COLOR: Record<string, string> = {
  "Very High": "text-emerald-600",
  "High": "text-emerald-600",
  "Medium": "text-amber-600",
  "Low": "text-zinc-500",
  "Inactive": "text-zinc-400",
};

function MetricCard({ label, value, icon, hint, valueColor }: { label: string; value: string; icon: React.ReactNode; hint?: string; valueColor?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="eyebrow flex items-center gap-1.5">{icon} {label}</p>
      <p className={cn("mt-2 font-display text-2xl font-semibold leading-tight", valueColor)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">{icon} {label}</dt>
      <dd className="text-sm font-semibold tabular">{value}</dd>
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

      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to search
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Header */}
          <div className="pb-6 border-b border-border">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">{sponsor.industryCategory}</Badge>
              <BlurGate compact iconOnly className="rounded-full">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  TIER_BG[tier]
                )}>
                  <span className="text-[8px]" aria-hidden="true">{TIER_ICON[tier]}</span> {tier} Tier
                </span>
              </BlurGate>
              {sponsor.rating === "A" ? (
                <Badge variant="emerald"><ShieldCheck className="size-3.5" /> A-rated</Badge>
              ) : (
                <Badge variant="amber"><ShieldAlert className="size-3.5" /> {sponsor.rating}-rated</Badge>
              )}
              <Badge variant={sponsor.licenceStatus === "Active" ? "cyan" : "rose"}>
                {sponsor.licenceStatus}
              </Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{sponsor.organisationName}</h1>
            <p className="mt-3 flex items-center gap-1.5 text-base text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <Link href={`/city/${sponsor.town.toLowerCase()}`} className="transition-colors hover:text-red-600">
                {sponsor.town}{sponsor.county ? `, ${sponsor.county}` : ""}
              </Link>
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BlurGate blurClassName="blur-[5px]">
              <MetricCard label="Activity" value={activity} icon={<ActivityIcon className="size-4" />} hint="2025 hiring" valueColor={ACTIVITY_COLOR[activity]} />
            </BlurGate>
            <MetricCard label="CoS 2025" value={cosDisplay} icon={<TrendingUp className="size-4" />} hint="total issued" />
            <MetricCard label="Visa Routes" value={`${(sponsor.routes ?? []).length}`} icon={<Globe className="size-4" />} hint="licenced" />
            <BlurGate blurClassName="blur-[5px]">
              <MetricCard label="Tier" value={tier} icon={<Trophy className="size-4" />} hint={sponsor.rating + "-rated"} />
            </BlurGate>
          </div>

          {/* Intelligence scores */}
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">Pro Intelligence</p>
                <h2 className="font-display text-lg font-semibold">Sponsor Intelligence Scores</h2>
              </div>
              <Badge variant="cyan" className="text-[10px]">Pro</Badge>
            </div>
            <div className="space-y-5">
              <ScoreMeter score={sponsor.sponsorStrengthScore} label="Sponsor Strength Score" textColor="text-emerald-600" barColor="bg-emerald-500" />
              <ScoreMeter score={sponsor.opportunityScore} label="Opportunity Score" textColor="text-red-600" barColor="bg-red-600" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Strength factors</p>
                <p className="text-xs leading-relaxed text-muted-foreground">A/B rating · CoS volume · Route breadth · GBM activity</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Opportunity factors</p>
                <p className="text-xs leading-relaxed text-muted-foreground">CoS volume · City demand · Route breadth · Tier</p>
              </div>
            </div>
          </div>

          {/* CoS breakdown */}
          <div className="surface-card p-5">
            <p className="eyebrow mb-1">Home Office FOI Data</p>
            <h2 className="font-display text-lg font-semibold">2025 CoS Breakdown</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Certificates of Sponsorship issued Jan–Dec 2025
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="eyebrow mb-2">Skilled Worker</p>
                <p className="font-display text-2xl font-semibold tabular">
                  {sponsor.cos2025Sw?.toLocaleString() ?? (sponsor.cos2025SwSuppressed ? "< 5" : "—")}
                </p>
                {sponsor.cos2025SwSuppressed && (
                  <p className="text-xs text-muted-foreground mt-1.5">Suppressed by Home Office (1–4 CoS)</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="eyebrow mb-2">Global Business Mobility</p>
                <p className="font-display text-2xl font-semibold tabular">
                  {sponsor.cos2025Gbm?.toLocaleString() ?? (sponsor.cos2025GbmSuppressed ? "< 5" : "—")}
                </p>
                {sponsor.cos2025GbmSuppressed && (
                  <p className="text-xs text-muted-foreground mt-1.5">Suppressed by Home Office (1–4 CoS)</p>
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
          />

          {/* Visa routes held */}
          {(sponsor.routes ?? []).length > 0 && (
            <div className="surface-card p-5">
              <p className="eyebrow mb-1">Licences held</p>
              <h2 className="font-display text-lg font-semibold">Visa Routes Licensed</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(sponsor.routes ?? [sponsor.route]).map((r) => (
                  <Link
                    key={r}
                    href={`/route/${r.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
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
              <p className="eyebrow mb-1">Career targeting</p>
              <h2 className="font-display text-lg font-semibold">Suggested Roles to Target</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">SOC codes aligned to this sponsor&apos;s hiring patterns</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestedSoc.map((soc) => (
                  <Link
                    key={soc!.socCode}
                    href={`/soc-codes?q=${soc!.socCode}`}
                    className="rounded-lg border border-border bg-surface/50 p-3 transition-colors hover:border-red-600/30 hover:bg-red-600/[0.03]"
                  >
                    <p className="font-mono text-xs font-medium text-red-600">SOC {soc!.socCode}</p>
                    <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug">{soc!.occupationTitle}</p>
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
              <p className="eyebrow mb-1">More like this</p>
              <h2 className="font-display text-lg font-semibold">Similar Sponsors</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Same industry or city · ranked by opportunity score</p>
              <ul className="divide-y divide-border">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sponsors/${s.id}`}
                      className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:text-red-600"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{s.organisationName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.town} · {s.industryCategory} ·{" "}
                          {s.cos2025Total ? `${s.cos2025Total.toLocaleString()} CoS` : s.hiringActivity}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-semibold tabular",
                          s.opportunityScore >= 70 ? "text-emerald-600" : s.opportunityScore >= 40 ? "text-amber-600" : "text-zinc-400"
                        )}>
                          {s.opportunityScore}<span className="font-normal text-muted-foreground">/100</span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
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
<SponsorActions sponsorId={sponsor.id} name={sponsor.organisationName} />

          <div className="surface-card p-5">
            <p className="eyebrow mb-3">Quick Facts</p>
            <dl className="divide-y divide-border">
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
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 transition-colors hover:border-amber-300 hover:bg-amber-100/60"
          >
            <div>
              <p className="eyebrow mb-1 text-amber-700">Rankings</p>
              <p className="text-sm font-semibold text-amber-900">UK Sponsor Rankings</p>
              <p className="mt-0.5 text-xs text-amber-700">See how this sponsor compares to the top 100</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-amber-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
