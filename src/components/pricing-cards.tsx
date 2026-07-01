"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { PLANS } from "@/lib/pricing";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function startCheckout(planId: string, yearly: boolean): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, yearly }),
    });
    const data = await res.json();
    if (data.url) return data.url;
    return null;
  } catch {
    return null;
  }
}

export function PricingCards() {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  async function handleCta(planId: string) {
    if (planId === "free") {
      toast("You're on the Free plan. Start searching!", "success");
      return;
    }
    setLoadingPlan(planId);
    const url = await startCheckout(planId, yearly);
    setLoadingPlan(null);
    if (url) {
      window.location.href = url;
    } else {
      toast(
        "Stripe is not configured yet. Add STRIPE_SECRET_KEY and price IDs to your .env file to enable billing.",
        "info"
      );
    }
  }

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !yearly && "text-foreground", yearly && "text-muted-foreground")}>
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
        <span className={cn("text-sm font-medium", yearly && "text-foreground", !yearly && "text-muted-foreground")}>
          Annual
          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            Save 58%
          </span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const displayPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          const priceSuffix = plan.id === "free" ? "/mo" : yearly ? "/year" : "/mo";
          const altLabel =
            plan.id === "free"
              ? "or £0/year · Save 0%"
              : yearly
              ? `or ${plan.monthlyPrice}/mo`
              : `or ${plan.yearlyPrice}/year · Save ${plan.yearlySaving}`;

          return (
            <div
              key={plan.id}
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

              {plan.id === "free" ? (
                <Link
                  href="/register"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  {plan.cta}
                </Link>
              ) : (
                <Button
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="mt-6 w-full"
                  disabled={loadingPlan === plan.id}
                  onClick={() => handleCta(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 className="size-4 animate-spin" /> Redirecting…</>
                  ) : plan.cta}
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
