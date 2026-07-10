import Image from "next/image";
import Link from "next/link";
import {
  Search, Filter, Target, Bell, Send, Star, ChevronDown,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import { StatCounter } from "@/components/stat-counter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATS = [
  { value: 126000, suffix: "+", label: "Verified Sponsors Indexed" },
  { value: 654, suffix: "", label: "New This Month" },
  { value: 24, suffix: "/7", label: "Daily Updates" },
  { value: 100, suffix: "%", label: "Free · For Job Seekers" },
];

/** Small pill-styled read-only "control" used to mock up form fields inside a step card. */
function MiniField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground">
        <span className="truncate">{value}</span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}

function CardNumber({ n, light = false }: { n: string; light?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -top-3 left-5 grid size-7 place-items-center rounded-lg text-[11px] font-bold shadow-sm",
        light ? "bg-white text-red-600" : "bg-red-600 text-white"
      )}
    >
      {n}
    </span>
  );
}

export function HowItWorks() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-3 text-red-600">How It Works</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          How It <span className="text-red-600">Works</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          A simple 5-step process to find UK employers that actually sponsor.
        </p>
      </div>

      {/* ── Step cards ── */}
      <div className="stagger relative mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. Search */}
        <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 pt-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30 hover:shadow-lg">
          <CardNumber n="01" />
          <span className="grid size-11 place-items-center rounded-xl bg-red-600/10 text-red-600">
            <Search className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-base font-semibold">Search</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Search 126K+ indexed sponsors by name, city or industry.
          </p>

          <div className="mt-4 space-y-2.5">
            <MiniField label="Job title, keywords or company" value="e.g. Software Engineer" />
            <MiniField label="Location" value="e.g. London, Manchester" />
            <MiniField label="Industry" value="All industries" />
          </div>

          <span className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "pointer-events-none mt-4 w-full")}>
            <Search className="size-3.5" /> Search Sponsors
          </span>
        </div>

        {/* 2. Filter */}
        <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 pt-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30 hover:shadow-lg">
          <CardNumber n="02" />
          <span className="grid size-11 place-items-center rounded-xl bg-red-600/10 text-red-600">
            <Filter className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-base font-semibold">Filter</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Narrow down results by rating, visa route, CoS activity and hiring likelihood.
          </p>

          <div className="mt-4 space-y-2.5">
            <MiniField label="Rating" value={<span className="flex items-center gap-0.5">{Array.from({ length: 4 }).map((_, i) => <Star key={i} className="size-3 fill-amber-400 text-amber-400" />)} &amp; up</span>} />
            <MiniField label="Visa Route" value="Skilled Worker" />
            <MiniField label="CoS Activity" value="Active in 6 months" />
            <MiniField label="Hiring Likelihood" value="High" />
          </div>

          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none mt-4 w-full")}>
            <Filter className="size-3.5" /> Apply Filters
          </span>
        </div>

        {/* 3. Assess Fit — highlighted */}
        <div className="relative flex flex-col rounded-2xl bg-red-600 p-5 pt-7 text-white shadow-[0_20px_50px_-20px_rgba(227,6,19,0.55)] transition-all duration-300 hover:-translate-y-1">
          <CardNumber n="03" light />
          <span className="absolute -top-3 right-5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600 shadow-sm">
            Popular
          </span>
          <span className="grid size-11 place-items-center rounded-xl bg-white text-red-600">
            <Target className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-base font-semibold">Assess Fit</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/85">
            Run AI Sponsorship Fit against your salary and SOC code.
          </p>

          <div className="mt-4 rounded-xl bg-white p-3.5 text-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">AI Match Score</p>
            <p className="mt-1 font-display text-3xl font-bold text-red-600">92%</p>
            <p className="text-xs font-semibold text-emerald-600">Excellent Match</p>
            <ul className="mt-2.5 space-y-1.5">
              {["Likely to sponsor", "Salary match: Excellent", "SOC code: In demand"].map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-xs text-foreground">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <span className="pointer-events-none mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/70 py-2 text-sm font-semibold text-white">
            Assess My Fit
          </span>
        </div>

        {/* 4. Set Alerts */}
        <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 pt-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30 hover:shadow-lg">
          <CardNumber n="04" />
          <span className="grid size-11 place-items-center rounded-xl bg-red-600/10 text-red-600">
            <Bell className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-base font-semibold">Set Alerts</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Get notified when matching sponsors start hiring.
          </p>

          <div className="mt-4 space-y-2.5">
            <MiniField label="Job Alerts" value="Weekly" />
            <MiniField label="Location Alerts" value="London, Manchester" />
            <MiniField label="New Sponsors" value="Added to platform" />
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-2.5 py-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">Email Notifications</span>
              <span className="relative inline-flex h-4 w-7 items-center rounded-full bg-red-600">
                <span className="inline-block size-3 translate-x-3.5 rounded-full bg-white shadow" />
              </span>
            </div>
          </div>

          <span className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "pointer-events-none mt-4 w-full")}>
            <Bell className="size-3.5" /> Create Alert
          </span>
        </div>

        {/* 5. Apply Smart */}
        <div className="relative flex flex-col rounded-2xl border border-border bg-card p-5 pt-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30 hover:shadow-lg">
          <CardNumber n="05" />
          <span className="grid size-11 place-items-center rounded-xl bg-red-600/10 text-red-600">
            <Send className="size-5" />
          </span>
          <h3 className="mt-4 font-heading text-base font-semibold">Apply Smart</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Target employers with proven, active sponsorship history and apply with confidence.
          </p>

          <ul className="mt-4 space-y-2">
            {["Verified sponsor", "Active CoS history", "High hiring likelihood", "Smart apply with one click"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-xs text-foreground">
                <CheckCircle2 className="size-3.5 shrink-0 text-red-600" /> {t}
              </li>
            ))}
          </ul>

          <span className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "pointer-events-none mt-4 w-full")}>
            <Send className="size-3.5" /> Apply Now
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stagger mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="glass p-6 text-center transition-transform duration-200 hover:-translate-y-0.5">
            <div className="font-display text-3xl text-foreground sm:text-4xl">
              <StatCounter value={s.value} suffix={s.suffix} />
            </div>
            <p className="eyebrow mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── CTA banner ── */}
      <div className="surface-card relative mt-6 overflow-hidden p-8 sm:p-10">
        <LondonSkyline className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-foreground/[0.05]" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo-mark.png" alt="" width={48} height={44} className="hidden size-12 w-auto shrink-0 sm:block" aria-hidden="true" />
            <div className="text-center sm:text-left">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                We make UK sponsorship job search{" "}
                <span className="text-red-600">smarter, faster and more effective.</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every industry. Every route. Every opportunity.
              </p>
            </div>
          </div>
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "gradient", size: "lg" }), "w-full shrink-0 sm:w-auto")}
          >
            Start Free Search <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Flat, low-opacity silhouette of a few recognisable London landmarks — purely decorative. */
function LondonSkyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 200" fill="currentColor" className={className} aria-hidden="true" role="presentation">
      {/* Big Ben */}
      <rect x="60" y="60" width="26" height="130" />
      <rect x="52" y="50" width="42" height="14" rx="2" />
      <polygon points="73,20 55,52 91,52" />
      {/* generic low-rise blocks */}
      <rect x="130" y="110" width="34" height="80" />
      <rect x="172" y="90" width="30" height="100" />
      {/* The Gherkin */}
      <path d="M 260 190 L 260 90 Q 260 60 285 60 Q 310 60 310 90 L 310 190 Z" />
      {/* London Eye */}
      <circle cx="420" cy="120" r="60" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="416" y="178" width="8" height="14" />
      <rect x="390" y="192" width="60" height="6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="420" y1="120"
          x2={420 + 60 * Math.cos((deg * Math.PI) / 180)}
          y2={120 + 60 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
        />
      ))}
      {/* right-hand generic skyline */}
      <rect x="900" y="100" width="32" height="90" />
      <rect x="940" y="70" width="36" height="120" />
      <rect x="984" y="120" width="28" height="70" />
      <rect x="1040" y="90" width="34" height="100" />
      <rect x="1082" y="130" width="30" height="60" />
    </svg>
  );
}
