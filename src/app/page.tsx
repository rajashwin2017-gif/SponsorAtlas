import Link from "next/link";
import {
  Search, Filter, Target, BellRing, Rocket, ArrowRight,
  ShieldCheck, FileCheck2, Ban, Building2, CalendarPlus, Sparkles,
} from "lucide-react";
import { StatCounter } from "@/components/stat-counter";
import { PricingCards } from "@/components/pricing-cards";
import { IndustryBalls } from "@/components/industry-balls";
import { SponsorTimeline } from "@/components/sponsor-timeline";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Search,   title: "Search",      desc: "Query 126k+ indexed sponsors by name, city or industry." },
  { icon: Filter,   title: "Filter",      desc: "Narrow by rating, route, CoS activity and hiring likelihood." },
  { icon: Target,   title: "Assess fit",  desc: "Run AI Sponsorship Fit against your salary and SOC code." },
  { icon: BellRing, title: "Set alerts",  desc: "Get notified when matching sponsors start hiring." },
  { icon: Rocket,   title: "Apply smart", desc: "Target employers with proven, active sponsorship history." },
];

const TRUST = [
  { icon: Building2,  label: "UK Registered" },
  { icon: ShieldCheck, label: "Open Gov Data" },
  { icon: FileCheck2, label: "Cancel Anytime" },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Atmospheric backgrounds */}
        <div className="absolute inset-0 grid-bg" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,hsl(0_72%_51%/0.14),transparent)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_40%_35%_at_50%_0%,hsl(0_72%_51%/0.06),transparent)]" aria-hidden="true" />

        <div className="container relative py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">

            {/* Eyebrow badge — matches splash uppercase style */}
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
              <span className="live-dot" aria-hidden="true" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                Real hiring signals · not just a sponsor list
              </span>
            </div>

            {/* H1 — cinematic serif matching splash brand feel */}
            <h1 className="font-display text-5xl font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find UK Employers That{" "}
              <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Actually Sponsor
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50">
              126,000+ verified UK sponsors ranked by real CoS activity.
              Stop applying blindly — target employers that hire.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "shadow-lg shadow-red-600/20")}
              >
                Start Free Search <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/70 backdrop-blur-sm transition-colors hover:border-white/20 hover:text-white/90"
              >
                <Sparkles className="size-4 text-red-500" /> See plans
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              {TRUST.map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 text-[13px] text-white/35">
                  <t.icon className="size-3.5 text-red-600/70" /> {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="stagger mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { value: 126419, suffix: "+", label: "Sponsors indexed" },
              { value: 654,    suffix: "",  label: "New this month" },
              { value: 24,     suffix: "/7", label: "Daily updates" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <div className="font-display text-4xl font-semibold text-white sm:text-5xl">
                  <StatCounter value={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">Process</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">How it works</h2>
          <p className="mt-4 text-white/45">
            From blind applications to a targeted sponsorship strategy in five steps.
          </p>
        </div>

        <ol className="stagger mt-14 grid gap-4 md:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-red-600/20 hover:bg-white/[0.04]">
                <span className="grid size-10 place-items-center rounded-xl border border-red-600/20 bg-red-600/10 text-red-500">
                  <step.icon className="size-4.5" />
                </span>
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-600/70 tabular">0{i + 1}</span>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Industry balls ── */}
      <IndustryBalls />

      {/* ── Journey timeline ── */}
      <SponsorTimeline />

      {/* ── Pricing preview ── */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">Pricing</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-white/45">
            Start free. Upgrade when you&apos;re ready to unlock hiring signals and AI fit scoring.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/30">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-red-600/60" /> Secure checkout</span>
          <span className="flex items-center gap-1.5"><Ban className="size-4 text-red-600/60" /> Cancel anytime</span>
          <span className="flex items-center gap-1.5"><CalendarPlus className="size-4 text-red-600/60" /> No long-term contract</span>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02] p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,hsl(0_72%_51%/0.10),transparent)]" aria-hidden="true" />
          <div className="relative">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">Get started</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Start finding real sponsors today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/45">
              Join thousands of international workers building a smarter, evidence-based job search.
            </p>
            <Link
              href="/search"
              className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "mt-8 shadow-lg shadow-red-600/20")}
            >
              Start Free Search <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
