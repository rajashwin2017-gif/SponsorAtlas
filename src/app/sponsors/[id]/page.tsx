import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin, ShieldCheck, ShieldAlert, Flame, TrendingUp, Activity, Briefcase,
  Building2, Hash, CalendarClock, ArrowLeft, Banknote, ChevronRight, Dot,
} from "lucide-react";
import { SPONSORS, getSponsorById, getSimilarSponsors } from "@/lib/mock-data";
import { SOC_CODES } from "@/lib/soc-data";
import { hiringBand } from "@/lib/types";
import { CosChartLazy } from "@/components/cos-chart-lazy";
import { FitWidget } from "@/components/fit-widget";
import { SponsorActions } from "@/components/sponsor-actions";
import { Badge } from "@/components/ui/badge";
import { formatGBP, timeAgo } from "@/lib/utils";

export function generateStaticParams() {
  return SPONSORS.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = getSponsorById(params.id);
  if (!s) return { title: "Sponsor not found" };
  return {
    title: `${s.organisationName} · Visa Sponsor`,
    description: `${s.organisationName} in ${s.town} is a ${s.rating} ${s.route} sponsor. View CoS activity, hiring signals and salary-matched roles.`,
  };
}

const HIRING_META = {
  High: { icon: Flame, variant: "emerald" as const },
  Medium: { icon: TrendingUp, variant: "amber" as const },
  Low: { icon: Activity, variant: "default" as const },
};

export default function SponsorDetailPage({ params }: { params: { id: string } }) {
  const sponsor = getSponsorById(params.id);
  if (!sponsor) notFound();

  const band = hiringBand(sponsor.hiringLikelihoodScore);
  const HiringIcon = HIRING_META[band].icon;
  const similar = getSimilarSponsors(sponsor, 3);
  const suggestedSoc = sponsor.suggestedSocCodes
    .map((c) => SOC_CODES.find((s) => s.socCode === c))
    .filter(Boolean);

  // Synthetic recent job signals derived deterministically from the sponsor.
  const jobSignals = Array.from({ length: Math.min(4, sponsor.liveJobsCount) }).map((_, i) => {
    const soc = suggestedSoc[i % Math.max(1, suggestedSoc.length)];
    return {
      title: soc?.occupationTitle ?? "Skilled professional",
      socCode: soc?.socCode,
      board: ["LinkedIn", "Indeed", "Company site", "Glassdoor"][i % 4],
      daysAgo: i * 3 + 1,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: sponsor.organisationName,
    address: { "@type": "PostalAddress", addressLocality: sponsor.town, addressRegion: sponsor.county, addressCountry: "GB" },
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
              {sponsor.rating === "A-rated" ? (
                <Badge variant="emerald"><ShieldCheck className="size-3.5" /> A-rated</Badge>
              ) : (
                <Badge variant="amber"><ShieldAlert className="size-3.5" /> B-rated</Badge>
              )}
              <Badge variant={sponsor.licenceStatus === "Active" ? "cyan" : "rose"}>
                {sponsor.licenceStatus}
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl tracking-tight">{sponsor.organisationName}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" /> {sponsor.town}, {sponsor.county}
            </p>
          </div>

          {/* Key metric cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Hiring" value={band} icon={<HiringIcon className="size-4" />} hint={`${sponsor.hiringLikelihoodScore}/100`} />
            <MetricCard label="CoS 2025" value={`${sponsor.cosActivity2025}`} icon={<TrendingUp className="size-4" />} hint="issued" />
            <MetricCard label="Live jobs" value={`${sponsor.liveJobsCount}`} icon={<Briefcase className="size-4" />} hint={timeAgo(sponsor.lastJobPostedAt)} />
            <MetricCard label="Size" value={sponsor.companySize} icon={<Building2 className="size-4" />} hint={sponsor.route} />
          </div>

          {/* CoS chart */}
          <div className="surface-card p-5">
            <h2 className="font-heading text-base font-semibold">Certificate of Sponsorship activity</h2>
            <p className="mb-3 text-xs text-muted-foreground">Defined CoS issued per year · 2026 is a partial year</p>
            <CosChartLazy sponsor={sponsor} />
          </div>

          {/* Job signals */}
          <div className="surface-card p-5">
            <h2 className="font-heading text-base font-semibold">Recent job signals</h2>
            {jobSignals.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No live job postings detected for this sponsor right now. Set an alert to be notified when they start hiring.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {jobSignals.map((j, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{j.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {j.socCode && <>SOC {j.socCode} <Dot className="size-3" /></>}
                        {j.board} <Dot className="size-3" /> {j.daysAgo}d ago
                      </p>
                    </div>
                    <Badge variant="cyan" className="shrink-0">Open</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Suggested roles */}
          {suggestedSoc.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="font-heading text-base font-semibold">Suggested roles to target</h2>
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
              <h2 className="font-heading text-base font-semibold">Similar sponsors</h2>
              <ul className="mt-3 divide-y divide-border">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link href={`/sponsors/${s.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-red-600">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.organisationName}</p>
                        <p className="text-xs text-muted-foreground">{s.town} · {s.industryCategory}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-red-600">
                        {s.hiringLikelihoodScore}/100 <ChevronRight className="size-4" />
                      </span>
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
            <h2 className="font-heading text-sm font-semibold">Quick facts</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Fact icon={<Hash className="size-3.5" />} label="Companies House" value={sponsor.companiesHouseNumber} />
              <Fact icon={<Hash className="size-3.5" />} label="SIC code" value={sponsor.sicCode} />
              <Fact icon={<CalendarClock className="size-3.5" />} label="On register since" value={new Date(sponsor.addedDate).toLocaleDateString("en-GB", { year: "numeric", month: "short" })} />
              <Fact icon={<CalendarClock className="size-3.5" />} label="Last updated" value={timeAgo(sponsor.lastUpdated)} />
            </dl>
          </div>
        </div>
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
