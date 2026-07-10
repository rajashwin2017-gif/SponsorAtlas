import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export type BillingInterval = "month" | "year";

// Price IDs live on the Plan row (admin-managed, synced to Stripe on
// save — see src/app/api/admin/plans) instead of env vars, so pricing can
// change without a redeploy.
export async function getPlanPriceId(planId: string, yearly: boolean): Promise<string | undefined> {
  const plan = await prisma.plan.findUnique({ where: { planId } });
  if (!plan) return undefined;
  return (yearly ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId) ?? undefined;
}

export async function getPlanFromPriceId(priceId: string) {
  const plan = await prisma.plan.findFirst({
    where: { OR: [{ stripeMonthlyPriceId: priceId }, { stripeYearlyPriceId: priceId }] },
  });
  if (!plan) return undefined;
  const interval: BillingInterval = plan.stripeYearlyPriceId === priceId ? "year" : "month";
  return { plan: plan.planId, interval };
}

export function checksLimitForPlan(planId: string): number {
  if (planId === "pro" || planId === "pro_plus") return 9999;
  return 5; // free
}
