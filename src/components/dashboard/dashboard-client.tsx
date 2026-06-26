"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Heart, Zap, BellRing, Settings, Sparkles, ArrowRight, Bookmark,
  TrendingUp, Activity, Plus, Trash2, Gauge, FlaskConical,
} from "lucide-react";
import { useSaved } from "@/hooks/use-saved";
import { useTier, TIER_LABEL, type Tier } from "@/hooks/use-tier";
import { SPONSORS } from "@/lib/mock-data";
import { SponsorCard } from "@/components/sponsor-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { INDUSTRY_LIST, CITY_LIST } from "@/lib/mock-data";

type Tab = "overview" | "saved" | "fit" | "alerts" | "settings";

const NAV: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "saved", label: "Saved Sponsors", icon: Heart },
  { id: "fit", label: "Fit Checks", icon: Zap },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "settings", label: "Settings", icon: Settings },
];

// Demo account — in production this comes from the authenticated session.
const USER = { name: "Alex", checksUsed: 3, checksLimit: 5 };

export function DashboardClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const { saved } = useSaved();
  const { tier, setTier, isPro } = useTier();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([
    { id: 1, industry: "Tech", city: "London", frequency: "weekly", active: true },
  ]);

  const savedSponsors = useMemo(
    () => SPONSORS.filter((s) => saved.includes(s.id)),
    [saved]
  );

  return (
    <div className="container py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="surface-card p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-red-600 to-zinc-900 font-heading font-bold text-white">
                {USER.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{USER.name}</p>
                <Badge variant={isPro ? "emerald" : "outline"} className="mt-0.5">
                  {TIER_LABEL[tier]}
                </Badge>
              </div>
            </div>

            <nav className="mt-3 space-y-0.5" aria-label="Dashboard">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  aria-current={tab === n.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    tab === n.id ? "bg-red-600/10 text-red-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <n.icon className="size-4" /> {n.label}
                  {n.id === "saved" && savedSponsors.length > 0 && (
                    <Badge variant="default" className="ml-auto px-1.5 py-0">{savedSponsors.length}</Badge>
                  )}
                </button>
              ))}
            </nav>

            {/* Usage meter */}
            {!isPro && (
              <div className="mt-4 rounded-lg border border-border bg-surface/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Free searches</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-zinc-900"
                    style={{ width: `${(USER.checksUsed / USER.checksLimit) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs tabular text-muted-foreground">
                  {USER.checksUsed}/{USER.checksLimit} used this month
                </p>
              </div>
            )}

            {/* Testing-only: preview the dashboard & sponsor cards as each plan */}
            <div className="mt-4 rounded-lg border border-dashed border-red-600/40 bg-red-600/[0.03] p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <FlaskConical className="size-3.5 text-red-600" /> Preview as
                <span className="ml-auto rounded bg-red-600/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-600">
                  Testing
                </span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1" role="group" aria-label="Preview plan tier">
                {(["free", "pro", "pro_plus"] as Tier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTier(t);
                      toast(`Previewing ${TIER_LABEL[t]} plan`, "info");
                    }}
                    aria-pressed={tier === t}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                      tier === t
                        ? "bg-gradient-to-r from-red-600 to-zinc-900 text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {TIER_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 space-y-6">
          {tab === "overview" && <Overview savedCount={savedSponsors.length} alerts={alerts.length} isPro={isPro} />}

          {tab === "saved" && (
            <Section title="Saved Sponsors" subtitle={`${savedSponsors.length} saved`}>
              {savedSponsors.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="size-7" />}
                  title="No saved sponsors yet"
                  body="Save sponsors from search to build your shortlist and compare them here."
                  cta={{ href: "/search", label: "Browse sponsors" }}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedSponsors.map((s) => <SponsorCard key={s.id} sponsor={s} isPro={isPro} />)}
                </div>
              )}
            </Section>
          )}

          {tab === "fit" && (
            <Section title="Fit Checks" subtitle="AI Sponsorship Fit history">
              <EmptyState
                icon={<Zap className="size-7" />}
                title="No fit checks run yet"
                body="Open any sponsor and run an AI Sponsorship Fit to score your profile. Results appear here."
                cta={{ href: "/search", label: "Find a sponsor" }}
              />
            </Section>
          )}

          {tab === "alerts" && (
            <Section title="Opportunity Alerts" subtitle="Get notified when matching sponsors hire">
              <AlertsPanel alerts={alerts} setAlerts={setAlerts} toast={toast} />
            </Section>
          )}

          {tab === "settings" && (
            <Section title="Settings" subtitle="Account & subscription">
              <div className="surface-card divide-y divide-border">
                <Row label="Email" value="alex@example.com" />
                <Row label="Plan" value={TIER_LABEL[tier]} />
                <Row label="Alert frequency" value="Weekly" />
                <div className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium">Subscription</p>
                    <p className="text-xs text-muted-foreground">Manage billing via Stripe customer portal</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast("Stripe customer portal would open (integration stub).", "info")}>
                    Manage billing
                  </Button>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Overview({ savedCount, alerts, isPro }: { savedCount: number; alerts: number; isPro: boolean }) {
  return (
    <>
      <div className="surface-card relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_100%_0%,hsl(0_72%_51%/0.12),transparent)]" aria-hidden="true" />
        <div className="relative">
          <h1 className="font-display text-2xl tracking-tight">Welcome back, {USER.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your sponsorship search at a glance.</p>
        </div>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-3">
        <StatTile icon={<Heart className="size-4" />} label="Saved sponsors" value={savedCount} />
        <StatTile icon={<Zap className="size-4" />} label="Fit checks run" value={0} />
        <StatTile icon={<BellRing className="size-4" />} label="Active alerts" value={alerts} />
      </div>

      {!isPro && (
        <div className="surface-card flex flex-col items-start justify-between gap-4 border-red-600/30 bg-gradient-to-r from-red-600/[0.08] to-zinc-900/[0.06] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-heading font-semibold">
              <Sparkles className="size-4 text-red-600" /> Unlock hiring signals & AI fit scoring
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upgrade to Pro for unlimited searches, CoS data, live jobs and weekly alerts.
            </p>
          </div>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "gradient" }), "shrink-0")}>
            Upgrade to Pro <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      <Section title="Recent activity" subtitle="Your latest actions">
        <div className="surface-card divide-y divide-border">
          {[
            { icon: <TrendingUp className="size-4 text-red-600" />, text: "Sponsor index refreshed: 654 new sponsors added", time: "2h ago" },
            { icon: <Heart className="size-4 text-red-600" />, text: `You have ${savedCount} saved sponsor${savedCount === 1 ? "" : "s"}`, time: "Today" },
            { icon: <Activity className="size-4 text-zinc-700" />, text: "Welcome to The Sponsor Finder. Your search starts here", time: "Today" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-muted">{a.icon}</span>
              <p className="flex-1 text-sm">{a.text}</p>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function AlertsPanel({ alerts, setAlerts, toast }: {
  alerts: { id: number; industry: string; city: string; frequency: string; active: boolean }[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  toast: (m: string, v?: "success" | "error" | "info") => void;
}) {
  const [industry, setIndustry] = useState(INDUSTRY_LIST[0]);
  const [city, setCity] = useState(CITY_LIST[0]);
  const [frequency, setFrequency] = useState("weekly");

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <p className="text-sm font-semibold">Create an alert</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-10 rounded-lg border border-border bg-surface/60 px-3 text-sm">
            {INDUSTRY_LIST.map((i) => <option key={i}>{i}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-lg border border-border bg-surface/60 px-3 text-sm">
            {CITY_LIST.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-10 rounded-lg border border-border bg-surface/60 px-3 text-sm capitalize">
            {["daily", "weekly", "none"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <Button
            variant="gradient"
            onClick={() => {
              setAlerts((a) => [...a, { id: Date.now(), industry, city, frequency, active: true }]);
              toast("Alert created", "success");
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={<BellRing className="size-7" />} title="No alerts yet" body="Create an alert to get notified when matching sponsors start hiring." />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="surface-card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <BellRing className="size-4 text-zinc-700" />
                <span className="font-medium">{a.industry} · {a.city}</span>
                <Badge variant="outline" className="capitalize">{a.frequency}</Badge>
              </div>
              <button
                onClick={() => { setAlerts((list) => list.filter((x) => x.id !== a.id)); toast("Alert removed", "info"); }}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-red-600/10 hover:text-red-600"
                aria-label="Delete alert"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {label}</p>
      <p className="mt-2 font-display text-3xl tabular">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, body, cta }: { icon: React.ReactNode; title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <h3 className="mt-4 font-heading font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Link href={cta.href} className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "mt-5")}>
          {cta.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
