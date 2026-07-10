import Link from "next/link";
import {
  ArrowRight, ShieldCheck, FileCheck2, Ban, Building2, CalendarPlus,
} from "lucide-react";
import { StatCounter } from "@/components/stat-counter";
import { HeroBackground } from "@/components/hero-background";
import { HowItWorks } from "@/components/how-it-works";
import { PricingCards } from "@/components/pricing-cards";
import { IndustryBalls } from "@/components/industry-balls";
import { PlatformDemo } from "@/components/platform-demo";
import { WatchDemoButton } from "@/components/watch-demo-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRUST = [
  { icon: Building2, label: "UK Registered" },
  { icon: ShieldCheck, label: "Open Gov Data" },
  { icon: FileCheck2, label: "Cancel Anytime" },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg animate-grid-pan" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(356.5_95%_45.7%/0.12),transparent)]" aria-hidden="true" />
        <HeroBackground />

        <div className="container relative pb-20 pt-8 sm:pb-28 sm:pt-12">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="emerald" className="mx-auto mb-6 animate-fade-up px-4 py-1.5">
              <span className="live-dot" aria-hidden="true" /> Real hiring signals, not just a sponsor list
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Find UK Employers That{" "}
              <span className="gradient-text">Actually Sponsor</span>
            </h1>
            <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
              126,000+ verified UK sponsors ranked by real CoS activity.
              Stop applying blindly — target employers that hire.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/search" className={cn(buttonVariants({ variant: "gradient", size: "lg" }))}>
                Start Free Search <ArrowRight className="size-4" />
              </Link>
              <WatchDemoButton />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              {TRUST.map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <t.icon className="size-4 text-red-600" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="stagger mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: 126000, suffix: "+", label: "Sponsors indexed" },
              { value: 654, suffix: "", label: "New this month" },
              { value: 24, suffix: "/7", label: "Daily updates" },
            ].map((s) => (
              <div key={s.label} className="glass p-7 text-center transition-transform duration-200 hover:-translate-y-0.5">
                <div className="font-display text-4xl text-foreground sm:text-5xl">
                  <StatCounter value={s.value} suffix={s.suffix} />
                </div>
                <p className="eyebrow mt-3">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Industry balls ── */}
      <IndustryBalls />

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
