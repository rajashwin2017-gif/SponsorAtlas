"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Heart, Zap, BellRing, Settings, Sparkles, ArrowRight, Bookmark,
  TrendingUp, Activity, Plus, Trash2, Gauge,
} from "lucide-react";
import { useSaved } from "@/hooks/use-saved";
import { useTier, TIER_LABEL } from "@/hooks/use-tier";
import { useProfile } from "@/hooks/use-profile";
import { SPONSORS } from "@/lib/mock-data";
import { SponsorCard } from "@/components/sponsor-card";
import { BillingPanel } from "@/components/dashboard/billing-panel";
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

export function DashboardClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const { toast } = useToast();

  // After Stripe redirects here with ?upgraded=1, wait briefly for the
  // webhook to land then force a JWT re-sync so the tier badge updates
  // immediately without requiring a sign-out / sign-in cycle.
  useEffect(() => {
    if (searchParams.get("upgraded") !== "1") return;
    const timer = setTimeout(async () => {
      await update();
      router.replace("/dashboard");
      toast("Your account has been upgraded! Welcome to Pro.", "success");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  const { saved } = useSaved();
  const { tier, isPro } = useTier();
  const { profile } = useProfile();
  const [alerts, setAlerts] = useState([
    { id: 1, industry: "Tech", city: "London", frequency: "weekly", active: true },
  ]);

  const displayName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "there";
  const checksUsed = profile?.monthlyChecksUsed ?? 0;
  const checksLimit = profile?.monthlyChecksLimit ?? 5;

  const savedSponsors = useMemo(
    () => SPONSORS.filter((s) => saved.includes(s.id)),
    [saved]
  );

  return (
    <div className="container py-10">
      <div className="grid gap-8 lg:grid-cols-[256px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="surface-card p-5">
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-red-600 to-zinc-900 font-heading text-lg font-bold text-white">
                {displayName[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold">{displayName}</p>
                <Badge variant={isPro ? "emerald" : "outline"} className="mt-1">
                  {TIER_LABEL[tier]}
                </Badge>
              </div>
            </div>

            <nav className="mt-4 space-y-0.5" aria-label="Dashboard">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  aria-current={tab === n.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    tab === n.id ? "bg-red-600/10 text-red-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <n.icon className="size-4 shrink-0" /> {n.label}
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
                    style={{ width: `${(checksUsed / checksLimit) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs tabular text-muted-foreground">
                  {checksUsed}/{checksLimit} used this month
                </p>
              </div>
            )}

          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 space-y-6">
          {tab === "overview" && (
            <Overview savedCount={savedSponsors.length} alerts={alerts.length} isPro={isPro} displayName={displayName} />
          )}

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
              <BillingPanel email={session?.user?.email ?? ""} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Overview({ savedCount, alerts, isPro, displayName }: { savedCount: number; alerts: number; isPro: boolean; displayName: string }) {
  return (
    <>
      <div className="surface-card relative overflow-hidden px-7 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_100%_0%,hsl(0_72%_51%/0.12),transparent)]" aria-hidden="true" />
        <div className="relative">
          <p className="eyebrow mb-2">Dashboard</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back, {displayName}</h1>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">Here&apos;s your sponsorship search at a glance.</p>
        </div>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-3">
        <StatTile icon={<Heart className="size-4" />} label="Saved sponsors" value={savedCount} />
        <StatTile icon={<Zap className="size-4" />} label="Fit checks run" value={0} />
        <StatTile icon={<BellRing className="size-4" />} label="Active alerts" value={alerts} />
      </div>

      {!isPro && (
        <div className="surface-card flex flex-col items-start justify-between gap-5 border-red-600/30 bg-gradient-to-r from-red-600/[0.08] to-zinc-900/[0.06] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-heading text-base font-semibold">
              <Sparkles className="size-4 text-red-600" /> Unlock hiring signals & AI fit scoring
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">{a.icon}</span>
              <p className="flex-1 text-sm leading-snug">{a.text}</p>
              <span className="shrink-0 text-xs tabular text-muted-foreground">{a.time}</span>
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
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="eyebrow flex items-center gap-2">{icon} {label}</p>
      <p className="mt-3 font-display text-4xl tabular">{value}</p>
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
