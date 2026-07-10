"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTier } from "@/hooks/use-tier";

interface ApiPlan {
  planId: string;
  name: string;
  tagline: string | null;
  badge: string | null;
  highlighted: boolean;
  monthlyPriceMinor: number;
  yearlyPriceMinor: number;
  features: string[];
}

interface SubInfo {
  status: string; // "active" | "trialing" | "past_due" | "canceled" | "inactive"
  cancelAtPeriodEnd: boolean;
}

// Feature lists are fixed product decisions — hardcoded here so they are
// always correct regardless of DB state. Prices still come from the API
// so the admin can update them without a redeploy.
const STATIC_FEATURES: Record<string, string[]> = {
  free: [
    "Sponsor licence holder directory",
    "Basic company information",
    "Industry & location filters",
    "Basic search functionality",
    "Limited vacancy views",
    "Publicly available sponsor info",
  ],
  pro: [
    "Everything in Free",
    "Active sponsorship vacancies",
    "Direct employer application links",
    "Unlimited searches",
    "Advanced filtering",
    "Save favourite employers & jobs",
    "Email alerts & notifications",
    "Sponsorship insights",
    "Employer activity updates",
  ],
  pro_plus: [
    "Everything in Pro",
    "Premium candidate profile",
    "CV review tools",
    "AI CV matching",
    "Interview preparation resources",
    "Priority job alerts",
    "Employer recommendations",
    "Application tracking tools",
    "Priority customer support",
    "Early access to new features",
  ],
};

const FREE_PLAN = {
  planId: "free",
  name: "Free",
  badge: null as string | null,
  highlighted: false,
  monthlyPriceMinor: 0,
  yearlyPriceMinor: 0,
  features: STATIC_FEATURES.free,
};

function formatGBP(minor: number): string {
  return `£${(minor / 100).toFixed(2).replace(/\.00$/, "")}`;
}

function yearlySavingPct(monthlyMinor: number, yearlyMinor: number): number {
  if (!monthlyMinor) return 0;
  const equivalentYearly = monthlyMinor * 12;
  if (!equivalentYearly) return 0;
  return Math.max(0, Math.round((1 - yearlyMinor / equivalentYearly) * 100));
}

async function startCheckout(
  planId: string,
  yearly: boolean
): Promise<{ url?: string; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, yearly }),
    });
    const data = await res.json();
    return { url: data.url, error: data.error, status: res.status };
  } catch {
    return { error: "Network error" };
  }
}

export function PricingCards() {
  const { toast } = useToast();
  const { tier } = useTier();
  const { update } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ApiPlan[]) =>
        setPlans(data.map((p) => ({ ...p, features: STATIC_FEATURES[p.planId] ?? p.features })))
      )
      .finally(() => setLoading(false));

    // Fetch subscription status so we can show upgrade vs switch CTA.
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSubInfo({ status: data.status, cancelAtPeriodEnd: data.cancelAtPeriodEnd }))
      .catch(() => {});
  }, []);

  const hasActiveSub =
    subInfo?.status === "active" ||
    subInfo?.status === "trialing" ||
    subInfo?.status === "past_due";

  async function handleCta(planId: string) {
    if (planId === "free") {
      toast("You're on the Free plan. Start searching!", "success");
      return;
    }

    setLoadingPlan(planId);

    // Existing active subscriber → switch plan in-place to avoid double billing.
    if (hasActiveSub && tier !== "free") {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, yearly }),
      });
      const data = await res.json().catch(() => ({}));
      setLoadingPlan(null);

      if (res.ok) {
        await update(); // refresh JWT so tier badge updates immediately
        toast(
          `Switched to ${data.plan ?? planId}. Your billing has been updated.`,
          "success"
        );
        router.push("/dashboard");
      } else if (res.status === 401) {
        toast("Please sign in to change your plan.", "info");
        router.push("/login?callbackUrl=/pricing");
      } else {
        toast(data.error ?? "Could not switch plan. Please try again.", "error");
      }
      return;
    }

    // New subscriber → standard Stripe Checkout flow.
    const result = await startCheckout(planId, yearly);
    setLoadingPlan(null);

    if (result.url) {
      window.location.href = result.url;
    } else if (result.status === 401) {
      toast("Please sign in or register to upgrade.", "info");
      window.location.href = "/login?callbackUrl=/pricing";
    } else {
      toast(
        result.error ?? "This plan isn't available for checkout yet. Please check back soon.",
        "info"
      );
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading plans…</p>;
  }

  const allPlans = [FREE_PLAN, ...plans];

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-sm font-medium",
            !yearly && "text-foreground",
            yearly && "text-muted-foreground"
          )}
        >
          Monthly
        </span>
        <button
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            yearly ? "bg-emerald-500" : "bg-muted"
          )}
          aria-checked={yearly}
          role="switch"
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white shadow transition-transform",
              yearly ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium",
            yearly && "text-foreground",
            !yearly && "text-muted-foreground"
          )}
        >
          Annual
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {allPlans.map((plan) => {
          const saving = yearlySavingPct(plan.monthlyPriceMinor, plan.yearlyPriceMinor);
          const displayPrice = yearly
            ? formatGBP(plan.yearlyPriceMinor)
            : formatGBP(plan.monthlyPriceMinor);
          const priceSuffix =
            plan.planId === "free" ? "/mo" : yearly ? "/year" : "/mo";
          const altLabel =
            plan.planId === "free"
              ? "or £0/year · Save 0%"
              : yearly
              ? `or ${formatGBP(plan.monthlyPriceMinor)}/mo`
              : `or ${formatGBP(plan.yearlyPriceMinor)}/year · Save ${saving}%`;

          const isCurrentPlan = tier === plan.planId;
          const isBusy = loadingPlan === plan.planId;

          // CTA label: "Current plan" | "Switch to X" (existing sub) | "Upgrade to X"
          let ctaLabel = `Upgrade to ${plan.name}`;
          if (isCurrentPlan) {
            ctaLabel = "Current plan";
          } else if (hasActiveSub && tier !== "free" && plan.planId !== "free") {
            const isUpgrade = plan.planId === "pro_plus" && tier === "pro";
            ctaLabel = isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
          }

          return (
            <div
              key={plan.planId}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
                plan.highlighted
                  ? "border-red-600/50 bg-card glow-accent lg:-translate-y-2"
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              {plan.badge && (
                <Badge
                  variant="emerald"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 shadow-lg"
                >
                  <Sparkles className="size-3.5" /> {plan.badge}
                </Badge>
              )}

              <h3 className="font-heading text-lg font-bold">{plan.name}</h3>

              <div className="mt-5">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold tabular">{displayPrice}</span>
                  <span className="text-sm text-muted-foreground">{priceSuffix}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{altLabel}</p>
              </div>

              {plan.planId === "free" ? (
                isCurrentPlan ? (
                  <Button variant="outline" className="mt-6 w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Link
                    href="/register"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    Start free
                  </Link>
                )
              ) : isCurrentPlan ? (
                <Button variant="outline" className="mt-6 w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="mt-6 w-full"
                  disabled={isBusy}
                  onClick={() => handleCta(plan.planId)}
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    ctaLabel
                  )}
                </Button>
              )}

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-red-600" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
