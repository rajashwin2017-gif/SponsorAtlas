"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Heart, Zap, BellRing, Settings, Sparkles, ArrowRight, Bookmark,
  TrendingUp, Activity, Plus, Trash2, Gauge, Crown, Star, Lock, CheckCircle,
  ChevronRight, Briefcase, BarChart3,
} from "lucide-react";
import { useSaved } from "@/hooks/use-saved";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useProfile } from "@/hooks/use-profile";
import { SPONSORS } from "@/lib/mock-data";
import { SponsorCard } from "@/components/sponsor-card";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
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

// Tier config — single source of truth for badge colours & icons
const TIER_CONFIG = {
  free: {
    label: "Free",
    icon: null,
    badgeCls: "bg-zinc-100 text-zinc-600 border-zinc-200",
    bannerCls: "from-zinc-50 to-zinc-100 border-zinc-200",
  },
  pro: {
    label: "Pro",
    icon: Star,
    badgeCls: "bg-red-50 text-red-700 border-red-200",
    bannerCls: "from-red-50 to-orange-50 border-red-200",
  },
  pro_plus: {
    label: "Pro+",
    icon: Crown,
    badgeCls: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
    bannerCls: "from-amber-50 to-orange-50 border-amber-200",
  },
} as const;

export function DashboardClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(searchParams.get("upgraded") === "1");

  const { saved } = useSaved();
  const { tier, isPro, isProPlus, loading: tierLoading, refetch: refetchTier } = useTier();
  const { profile } = useProfile();
  const [alerts, setAlerts] = useState([
    { id: 1, industry: "Tech", city: "London", frequency: "weekly", active: true },
  ]);

  // ?upgraded=1 — Stripe just redirected back after payment. Show loader,
  // sync the subscription to DB, then hard-reload to a clean URL.
  // useTier reads tier directly from the DB so the badge updates automatically.
  useEffect(() => {
    if (searchParams.get("upgraded") !== "1") return;
    (async () => {
      const syncRes = await fetch("/api/stripe/sync", { method: "POST" })
        .then((r) => r.json())
        .catch(() => null);
      const plan = syncRes?.plan ?? "pro";
      const planLabel = plan === "pro_plus" ? "Pro+" : plan === "pro" ? "Pro" : "your new plan";
      await refetchTier();
      setUpgrading(false);
      router.replace("/dashboard");
      toast(`Your account has been upgraded! Welcome to ${planLabel}.`, "success");
    })();
  }, []);

  const displayName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "there";
  const checksUsed = profile?.monthlyChecksUsed ?? 0;
  const checksLimit = profile?.monthlyChecksLimit ?? 5;
  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  // While the DB tier fetch is in flight, treat the account as the most
  // restrictive tier so a stale JWT can't briefly unlock paid features.
  const effectiveIsPro = tierLoading ? false : isPro;
  const effectiveIsProPlus = tierLoading ? false : isProPlus;

  const savedSponsors = useMemo(
    () => SPONSORS.filter((s) => saved.includes(s.id)),
    [saved]
  );

  if (upgrading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
        <div className="relative flex items-center justify-center">
          <span className="absolute size-20 animate-ping rounded-full bg-red-600/20" />
          <span className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-red-600 to-zinc-900">
            <Sparkles className="size-7 text-white" />
          </span>
        </div>
        <div className="text-center">
          <p className="font-heading text-xl font-bold">Activating your plan…</p>
          <p className="mt-1 text-sm text-muted-foreground">Hang tight, we're setting everything up for you.</p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-red-600" />
        </div>
        <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-3">

            {/* Profile card */}
            <div className="rounded-xl border border-border bg-white shadow-sm p-5">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-red-600 to-zinc-900 font-heading text-lg font-bold text-white shrink-0">
                  {displayName[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-zinc-900">{displayName}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                    tierLoading ? "bg-zinc-100 text-zinc-400 border-zinc-200" : tierConfig.badgeCls
                  )}>
                    {tierLoading ? "···" : (
                      <>
                        {TierIcon && <TierIcon className="size-3" />}
                        {tierConfig.label} Plan
                      </>
                    )}
                  </span>
                </div>
              </div>

              <nav className="mt-3 space-y-0.5" aria-label="Dashboard">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    aria-current={tab === n.id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                      tab === n.id
                        ? "bg-red-50 text-red-700"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <n.icon className="size-4 shrink-0" />
                    {n.label}
                    {n.id === "saved" && savedSponsors.length > 0 && (
                      <span className="ml-auto text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                        {savedSponsors.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tier status card */}
            <TierStatusCard
              tierLoading={tierLoading}
              checksUsed={checksUsed}
              checksLimit={checksLimit}
              isPro={effectiveIsPro}
              isProPlus={effectiveIsProPlus}
            />
          </aside>

          {/* ── Main ────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-5">
            {tab === "overview" && (
              <Overview
                savedCount={savedSponsors.length}
                alerts={alerts.length}
                isPro={effectiveIsPro}
                isProPlus={effectiveIsProPlus}
                tierLoading={tierLoading}
                tier={tier}
                displayName={displayName}
                checksUsed={checksUsed}
                checksLimit={checksLimit}
              />
            )}
            {tab === "saved" && (
              <Section title="Saved Sponsors" subtitle={`${savedSponsors.length} saved`}>
                {savedSponsors.length === 0 ? (
                  <EmptyState
                    icon={<Bookmark className="size-7" />}
                    title="No saved sponsors yet"
                    body="Save sponsors from search to build your shortlist."
                    cta={{ href: "/search", label: "Browse sponsors" }}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {savedSponsors.map((s) => <SponsorCard key={s.id} sponsor={s} isPro={effectiveIsPro} />)}
                  </div>
                )}
              </Section>
            )}
            {tab === "fit" && (
              <Section title="Fit Checks" subtitle="AI Sponsorship Fit history">
                {!effectiveIsPro ? (
                  <LockedFeature
                    icon={<Zap className="size-6 text-red-600" />}
                    title="AI Fit Scoring"
                    body="Get an instant score showing how well your profile matches any sponsor's hiring history."
                    requiredTier="Pro"
                  />
                ) : (
                  <EmptyState
                    icon={<Zap className="size-7" />}
                    title="No fit checks run yet"
                    body="Open any sponsor and run an AI Sponsorship Fit to score your profile."
                    cta={{ href: "/search", label: "Find a sponsor" }}
                  />
                )}
              </Section>
            )}
            {tab === "alerts" && (
              <Section title="Opportunity Alerts" subtitle="Get notified when matching sponsors hire">
                {!effectiveIsPro ? (
                  <LockedFeature
                    icon={<BellRing className="size-6 text-red-600" />}
                    title="Sponsor Alerts"
                    body="Get weekly email alerts when sponsors in your target industry start hiring."
                    requiredTier="Pro"
                  />
                ) : (
                  <AlertsPanel alerts={alerts} setAlerts={setAlerts} toast={toast} />
                )}
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
    </div>
  );
}

// ── Tier Status Sidebar Card ─────────────────────────────────────────────────

function TierStatusCard({
  tierLoading, checksUsed, checksLimit, isPro, isProPlus,
}: {
  tierLoading: boolean;
  checksUsed: number;
  checksLimit: number;
  isPro: boolean;
  isProPlus: boolean;
}) {
  if (tierLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded bg-zinc-100" />
        <div className="h-2 w-full rounded-full bg-zinc-100" />
        <div className="h-8 w-full rounded-lg bg-zinc-100" />
      </div>
    );
  }

  if (isProPlus) {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="size-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">Pro+ Active</span>
        </div>
        <p className="text-xs text-amber-700">All features unlocked. Unlimited access.</p>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="size-4 text-red-600" />
          <span className="text-sm font-bold text-red-800">Pro Active</span>
        </div>
        <p className="text-xs text-red-700 mb-3">Enjoying unlimited sponsor access.</p>
        <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline">
          <Crown className="size-3" /> Upgrade to Pro+ <ChevronRight className="size-3" />
        </Link>
      </div>
    );
  }

  // Free tier
  const usedPct = Math.min((checksUsed / checksLimit) * 100, 100);
  const almostOut = checksUsed >= checksLimit - 1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-zinc-500">Free searches used</span>
          <span className={cn("text-xs font-bold", almostOut ? "text-red-600" : "text-zinc-700")}>
            {checksUsed}/{checksLimit}
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", almostOut ? "bg-red-500" : "bg-zinc-400")}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {almostOut && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">Running low — upgrade to continue</p>
        )}
      </div>

      <div className="space-y-1.5">
        {[
          { label: "Unlimited sponsor search", locked: true },
          { label: "CoS data & hiring signals", locked: true },
          { label: "AI fit scoring", locked: true },
          { label: "Live job alerts", locked: true },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-xs text-zinc-400">
            <Lock className="size-3 shrink-0" />
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <Link href="/pricing" className={cn(
        "flex items-center justify-center gap-1.5 w-full rounded-lg py-2 text-xs font-bold",
        "bg-red-600 text-white hover:bg-red-700 transition-colors"
      )}>
        <Sparkles className="size-3.5" /> Upgrade to Pro
      </Link>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function Overview({
  savedCount, alerts, isPro, isProPlus, tierLoading, tier, displayName, checksUsed, checksLimit,
}: {
  savedCount: number; alerts: number; isPro: boolean; isProPlus: boolean; tierLoading: boolean;
  tier: Tier; displayName: string;
  checksUsed: number; checksLimit: number;
}) {
  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  return (
    <>
      {/* Welcome banner */}
      <div className={cn(
        "rounded-xl border bg-gradient-to-r p-6 relative overflow-hidden",
        tierLoading ? "from-zinc-50 to-zinc-100 border-zinc-200" : tierConfig.bannerCls
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_100%_0%,rgba(220,38,38,0.08),transparent)]" aria-hidden />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Dashboard</p>
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Welcome back, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-zinc-500">Here's your sponsorship search at a glance.</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold shrink-0 self-start",
            tierLoading ? "bg-zinc-100 text-zinc-400 border-zinc-200" : tierConfig.badgeCls
          )}>
            {tierLoading ? "···" : (
              <>
                {TierIcon && <TierIcon className="size-4" />}
                {tierConfig.label} Plan
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tier comparison banner — only for non-Pro+ */}
      {!isProPlus && (
        <TierComparisonBanner tier={tier} isPro={isPro} tierLoading={tierLoading} />
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<Heart className="size-4 text-red-600" />}
          label="Saved sponsors"
          value={savedCount}
        />
        <StatTile
          icon={<Zap className="size-4 text-amber-600" />}
          label="Fit checks run"
          value={0}
          locked={!isPro}
          lockedTier="Pro"
        />
        <StatTile
          icon={<BellRing className="size-4 text-blue-600" />}
          label="Active alerts"
          value={alerts}
          locked={!isPro}
          lockedTier="Pro"
        />
      </div>

      {/* Quick actions */}
      <Section title="Quick Actions" subtitle="Jump back in">
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction icon={<Search className="size-4" />} label="Search Sponsors" href="/search" description="Browse 126K+ verified sponsors" />
          <QuickAction icon={<Briefcase className="size-4" />} label="Job Board" href="/jobs" description="Live visa-sponsored UK roles" />
          <QuickAction icon={<BarChart3 className="size-4" />} label="Rankings" href="/sponsors/rankings" description="Top sponsors by CoS issued" />
        </div>
      </Section>

      {/* Recent activity */}
      <Section title="Recent Activity" subtitle="Your latest actions">
        <div className="rounded-xl border border-zinc-100 bg-white divide-y divide-zinc-50 shadow-sm">
          {[
            { icon: <TrendingUp className="size-4 text-red-600" />, text: "Sponsor index refreshed: 654 new sponsors added", time: "2h ago" },
            { icon: <Heart className="size-4 text-red-600" />, text: `You have ${savedCount} saved sponsor${savedCount === 1 ? "" : "s"}`, time: "Today" },
            { icon: <Activity className="size-4 text-zinc-400" />, text: "Welcome to The Sponsor Finder. Your search starts here", time: "Today" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-50">{a.icon}</span>
              <p className="flex-1 text-sm text-zinc-700 leading-snug">{a.text}</p>
              <span className="shrink-0 text-xs text-zinc-400">{a.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ── Tier Comparison Banner ────────────────────────────────────────────────────

function TierComparisonBanner({ tier, isPro, tierLoading }: { tier: Tier; isPro: boolean; tierLoading: boolean }) {
  const plans = [
    {
      name: "Free",
      price: "£0",
      current: !tierLoading && tier === "free",
      features: ["Preview 3 top sponsors per industry", "Healthcare, Tech & Hospitality sectors", "Top 3 live jobs per industry", "Basic company information"],
      cta: null,
      cls: "border-zinc-200 bg-zinc-50",
      headerCls: "bg-zinc-100 text-zinc-600",
    },
    {
      name: "Pro",
      price: "£19.99",
      current: !tierLoading && tier === "pro",
      features: ["30 sponsors per industry, all sectors", "Full profiles & hiring signals", "Unlimited search & filters", "Live job listings", "Save sponsors & jobs", "Email alerts"],
      cta: "/pricing",
      cls: "border-red-200 bg-white ring-2 ring-red-100",
      headerCls: "bg-red-600 text-white",
    },
    {
      name: "Pro+",
      price: "£29.99",
      current: !tierLoading && tier === "pro_plus",
      features: ["All 126,000+ sponsors unlocked", "CSV export", "Priority job alerts", "AI recommendations", "Priority support", "Early access"],
      cta: "/pricing",
      cls: "border-amber-200 bg-white",
      headerCls: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-zinc-900">Your Plan vs. What's Available</p>
        <p className="text-xs text-zinc-500 mt-0.5">Unlock more to accelerate your job search</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {plans.map((plan) => (
          <div key={plan.name} className={cn("rounded-lg border overflow-hidden", plan.cls)}>
            <div className={cn("px-3 py-2 flex items-center justify-between", plan.headerCls)}>
              <span className="text-xs font-bold">{plan.name}</span>
              {plan.name === "Pro" && !isPro && (
                <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5">POPULAR</span>
              )}
              {plan.current && (
                <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5">CURRENT</span>
              )}
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-base font-bold text-zinc-900">{plan.price}<span className="text-xs font-normal text-zinc-400">/mo</span></p>
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <CheckCircle className="size-3 text-green-500 shrink-0" /> {f}
                </div>
              ))}
              {plan.locked.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <Lock className="size-3 shrink-0" /> {f}
                </div>
              ))}
              {plan.cta && !plan.current && (
                <Link href={plan.cta} className={cn(
                  "mt-2 flex items-center justify-center gap-1 w-full rounded-md py-1.5 text-xs font-bold transition-colors",
                  plan.name === "Pro+" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90" : "bg-red-600 text-white hover:bg-red-700"
                )}>
                  {plan.name === "Pro+" ? <Crown className="size-3" /> : <Star className="size-3" />}
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Locked Feature ────────────────────────────────────────────────────────────

function LockedFeature({ icon, title, body, requiredTier }: {
  icon: React.ReactNode; title: string; body: string; requiredTier: "Pro" | "Pro+";
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-white border border-zinc-200 shadow-sm mb-4">
        {icon}
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <Lock className="size-3.5 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{requiredTier} Feature</span>
      </div>
      <h3 className="font-bold text-zinc-900 text-base">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-500">{body}</p>
      <Link href="/pricing" className={cn(
        buttonVariants({ size: "sm" }),
        "mt-5 bg-red-600 text-white hover:bg-red-700 gap-1.5"
      )}>
        <Sparkles className="size-3.5" /> Unlock with {requiredTier} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

// ── Alerts Panel ─────────────────────────────────────────────────────────────

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
      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-5">
        <p className="text-sm font-semibold text-zinc-900 mb-3">Create an alert</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900">
            {INDUSTRY_LIST.map((i) => <option key={i}>{i}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900">
            {CITY_LIST.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm capitalize text-zinc-900">
            {["daily", "weekly", "none"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <Button variant="gradient" onClick={() => {
            setAlerts((a) => [...a, { id: Date.now(), industry, city, frequency, active: true }]);
            toast("Alert created", "success");
          }}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={<BellRing className="size-7" />} title="No alerts yet"
          body="Create an alert to get notified when matching sponsors start hiring." />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-zinc-100 bg-white shadow-sm flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <BellRing className="size-4 text-zinc-400" />
                <span className="font-medium text-zinc-900">{a.industry} · {a.city}</span>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full capitalize">{a.frequency}</span>
              </div>
              <button
                onClick={() => { setAlerts((list) => list.filter((x) => x.id !== a.id)); toast("Alert removed", "info"); }}
                className="grid size-8 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
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

// ── Shared components ─────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function StatTile({ icon, label, value, locked, lockedTier }: {
  icon: React.ReactNode; label: string; value: number;
  locked?: boolean; lockedTier?: string;
}) {
  return (
    <div className={cn(
      "rounded-xl border bg-white shadow-sm p-5 relative overflow-hidden",
      locked ? "border-zinc-100" : "border-zinc-100 hover:-translate-y-0.5 transition-transform duration-200"
    )}>
      {locked && (
        <div className="absolute inset-0 bg-zinc-50/80 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
          <div className="text-center">
            <Lock className="size-4 text-zinc-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-zinc-400">{lockedTier} only</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
        {icon} {label}
      </div>
      <p className="font-display text-4xl font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}

function QuickAction({ icon, label, href, description }: {
  icon: React.ReactNode; label: string; href: string; description: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-zinc-100 bg-white shadow-sm p-4 flex items-center gap-3 hover:border-red-200 hover:bg-red-50/30 transition-colors cursor-pointer group">
      <span className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600 shrink-0 group-hover:bg-red-100 transition-colors">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900 truncate">{label}</p>
        <p className="text-xs text-zinc-400 truncate">{description}</p>
      </div>
      <ChevronRight className="size-4 text-zinc-300 ml-auto shrink-0 group-hover:text-red-400 transition-colors" />
    </Link>
  );
}

function EmptyState({ icon, title, body, cta }: {
  icon: React.ReactNode; title: string; body: string; cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-white border border-zinc-200 text-zinc-400 mb-4">{icon}</span>
      <h3 className="font-semibold text-zinc-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
      {cta && (
        <Link href={cta.href} className={cn(buttonVariants({ variant: "gradient", size: "sm" }), "mt-5")}>
          {cta.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
