import Link from "next/link";
import {
  Search, Filter, Target, BellRing, Rocket, ArrowRight, PlayCircle,
  ShieldCheck, FileCheck2, Ban, Building2, CalendarPlus,
} from "lucide-react";
import { StatCounter } from "@/components/stat-counter";
import { HeroBackground } from "@/components/hero-background";
import { PricingCards } from "@/components/pricing-cards";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Search, title: "Search", desc: "Query 126k+ indexed sponsors by name, city or industry." },
  { icon: Filter, title: "Filter", desc: "Narrow by rating, route, CoS activity and hiring likelihood." },
  { icon: Target, title: "Assess fit", desc: "Run AI Sponsorship Fit against your salary and SOC code." },
  { icon: BellRing, title: "Set alerts", desc: "Get notified when matching sponsors start hiring." },
  { icon: Rocket, title: "Apply smart", desc: "Target employers with proven, active sponsorship history." },
];

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
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(0_72%_51%/0.12),transparent)]" aria-hidden="true" />
        <HeroBackground />

        <div className="container relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="emerald" className="mx-auto mb-6 animate-fade-up px-3 py-1">
              <span className="live-dot" aria-hidden="true" /> Real hiring signals, not just a sponsor list
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Find UK Employers That <span className="gradient-text">Actually Sponsor Visas</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Real hiring signals from verified UK sponsors. Apply where it actually counts.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/search" className={cn(buttonVariants({ variant: "gradient", size: "lg" }))}>
                Start Free Search <ArrowRight className="size-4" />
              </Link>
              <Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                <PlayCircle className="size-4" /> Watch Demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {TRUST.map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <t.icon className="size-4 text-red-600" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="stagger mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: 126419, suffix: "+", label: "Sponsors indexed" },
              { value: 654, suffix: "", label: "New this month" },
              { value: 24, suffix: "/7", label: "Daily updates" },
            ].map((s) => (
              <div key={s.label} className="glass p-6 text-center transition-transform duration-200 hover:-translate-y-0.5">
                <div className="font-display text-3xl text-foreground sm:text-4xl">
                  <StatCounter value={s.value} suffix={s.suffix} />
                </div>
                <p className="eyebrow mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">
            From blind applications to a targeted sponsorship strategy in five steps.
          </p>
        </div>

        <ol className="stagger mt-14 grid gap-6 md:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <div className="surface-card flex h-full flex-col p-5">
                <span className="grid size-11 place-items-center rounded-lg bg-gradient-to-br from-red-600/20 to-zinc-900/20 text-red-600">
                  <step.icon className="size-5" />
                </span>
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-red-600 tabular">
                    0{i + 1}
                  </span>
                  <h3 className="font-heading text-sm font-semibold">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Demo placeholder ── */}
      <section className="container pb-20">
        <div className="surface-card relative mx-auto flex aspect-video max-w-4xl items-center justify-center overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,hsl(0_72%_51%/0.1),transparent)]" aria-hidden="true" />
          <div className="relative text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-600/15 text-red-600 ring-1 ring-red-600/30">
              <PlayCircle className="size-8" />
            </span>
            <p className="mt-4 font-heading font-semibold">Platform walkthrough</p>
            <p className="text-sm text-muted-foreground">2 min · See the search & fit engine in action</p>
          </div>
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
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
      <section className="container pb-24">
        <div className="surface-card relative overflow-hidden p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,hsl(0_72%_51%/0.15),transparent)]" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              Start finding real sponsors today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
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
