"use client";

import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/pricing";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingCards() {
  const { toast } = useToast();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => (
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
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-heading text-4xl font-bold tabular">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          </div>

          <Button
            variant={plan.highlighted ? "gradient" : "outline"}
            className="mt-6 w-full"
            onClick={() =>
              toast(
                plan.id === "free"
                  ? "Welcome aboard! Start searching for free."
                  : `Stripe checkout for ${plan.name} would open here (integration stub).`,
                "info"
              )
            }
          >
            {plan.cta}
          </Button>

          <ul className="mt-6 space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-red-600" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
