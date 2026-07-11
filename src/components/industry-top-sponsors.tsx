import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSponsors } from "@/lib/sponsor-store";
import { SponsorCard } from "@/components/sponsor-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURED_INDUSTRIES = [
  {
    key: "Hospitality",
    label: "Hospitality Jobs",
    href: "/jobs?industry=Hospitality",
    accent: "from-orange-50 to-orange-100/40 border-orange-200/60",
    eyebrow: "Top Hospitality Sponsors",
  },
  {
    key: "Technology",
    label: "Technology Jobs",
    href: "/jobs?industry=Technology",
    accent: "from-blue-50 to-blue-100/40 border-blue-200/60",
    eyebrow: "Top Technology Sponsors",
  },
  {
    key: "Healthcare",
    label: "Healthcare Jobs",
    href: "/jobs?industry=Healthcare",
    accent: "from-emerald-50 to-emerald-100/40 border-emerald-200/60",
    eyebrow: "Top Healthcare Sponsors",
  },
] as const;

function getTopByIndustry(industry: string, limit = 3) {
  return getSponsors()
    .filter((s) => s.industryCategory === industry)
    .sort((a, b) => (b.cos2025Total ?? 0) - (a.cos2025Total ?? 0))
    .slice(0, limit);
}

export function IndustryTopSponsors() {
  const sections = FEATURED_INDUSTRIES.map((ind) => ({
    ...ind,
    sponsors: getTopByIndustry(ind.key),
  }));

  return (
    <section className="container pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-3 text-red-600">Free preview</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Top sponsors by industry
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The highest-volume visa sponsors in three key sectors — free to explore, no sign-up required.
        </p>
      </div>

      <div className="mt-14 space-y-16">
        {sections.map(({ key, label, href, eyebrow, sponsors }) => (
          <div key={key}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">{eyebrow}</p>
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{label}</h3>
              </div>
              <Link
                href={href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 shrink-0 mt-1")}
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.map((s) => (
                <SponsorCard key={s.id} sponsor={s} isPro={false} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
