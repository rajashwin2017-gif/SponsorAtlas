import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, Ban, CalendarPlus,
  Building2, Users, Clock, Gift,
} from "lucide-react";
import { StatCounter } from "@/components/stat-counter";
import { HeroSearch } from "@/components/hero-search";
import { HowItWorks } from "@/components/how-it-works";
import { PricingCards } from "@/components/pricing-cards";
import { IndustryBalls } from "@/components/industry-balls";
import { IndustryTopSponsors } from "@/components/industry-top-sponsors";
import { PlatformDemo } from "@/components/platform-demo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_STATS = [
  { icon: Building2, value: 126000, suffix: "+", label: "Sponsors Indexed" },
  { icon: Users, value: 654, suffix: "", label: "New This Month" },
  { icon: Clock, value: 24, suffix: "/7", label: "Daily Updates" },
  { icon: Gift, value: 100, suffix: "%", label: "Free To Job Seekers" },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(356.5_95%_45.7%/0.08),transparent)]" aria-hidden="true" />

        <div className="container relative pb-16 pt-12 sm:pb-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Left: copy + search */}
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                The UK&apos;s Trusted Platform
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                Find UK Employers That{" "}
                <span className="gradient-text">Actually Sponsor</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Discover verified UK employers that offer visa sponsorship. Search jobs, check
                sponsorship details and take the next step in your career with confidence.
              </p>

              <div className="mt-8">
                <HeroSearch />
              </div>
            </div>

            {/* Right: hero photo — hidden on mobile */}
            <div className="relative mx-auto hidden aspect-[3/2] w-full max-w-xl overflow-hidden rounded-2xl shadow-[0_30px_70px_-30px_rgba(17,17,17,0.35)] sm:block lg:max-w-none">
              <Image
                src="/hero-photo.jpg"
                alt="A professional using The Sponsor Finder to search for UK visa-sponsored jobs"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Stats bar — inline row */}
          <div className="stagger mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-10 sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-600/10 text-red-600">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <div className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    <StatCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Industry balls ── */}
      <IndustryBalls />

      {/* ── Top sponsors by industry (free preview) ── */}
      <IndustryTopSponsors />

      {/* ── Interactive platform demo ── */}
      <section id="demo" className="container scroll-mt-24 pb-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-3 text-red-600">Live demo</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">See the search &amp; fit engine in action</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Watch a real query run end-to-end — search, ranked sponsors, and an instant sponsorship-fit score.
          </p>
        </div>
        <PlatformDemo />
      </section>

      {/* ── Pricing preview ── */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3 text-red-600">Pricing</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Start free. Upgrade when you&apos;re ready to unlock hiring signals and AI fit scoring.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-red-600" /> Secure checkout</span>
          <span className="flex items-center gap-1.5"><Ban className="size-4 text-red-600" /> Cancel anytime</span>
          <span className="flex items-center gap-1.5"><CalendarPlus className="size-4 text-red-600" /> No long-term contract</span>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container pb-28">
        <div className="surface-card relative overflow-hidden p-12 text-center sm:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,hsl(356.5_95%_45.7%/0.15),transparent)]" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow mb-4 text-red-600">Get started</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Start finding real sponsors today
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Join thousands of international workers building a smarter, evidence-based job search.
            </p>
            <Link
              href="/search"
              className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "mt-8")}
            >
              Start Free Search <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
