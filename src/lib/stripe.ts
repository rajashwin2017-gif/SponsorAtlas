import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export type PlanId = "pro" | "pro_plus";
export type BillingInterval = "month" | "year";

// price -> (plan, interval) and the inverse, built from the four Stripe
// Price IDs configured in .env. Centralizing this avoids hardcoding price
// IDs in both the checkout route and the webhook handler.
const PRICE_MAP: Record<string, { plan: PlanId; interval: BillingInterval }> = {};
if (process.env.STRIPE_PRICE_PRO_MONTHLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_MONTHLY] = { plan: "pro", interval: "month" };
}
if (process.env.STRIPE_PRICE_PRO_YEARLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_YEARLY] = { plan: "pro", interval: "year" };
}
if (process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY] = { plan: "pro_plus", interval: "month" };
}
if (process.env.STRIPE_PRICE_PRO_PLUS_YEARLY) {
  PRICE_MAP[process.env.STRIPE_PRICE_PRO_PLUS_YEARLY] = { plan: "pro_plus", interval: "year" };
}

export function priceIdFor(plan: PlanId, yearly: boolean): string | undefined {
  const key =
    plan === "pro"
      ? yearly
        ? "STRIPE_PRICE_PRO_YEARLY"
        : "STRIPE_PRICE_PRO_MONTHLY"
      : yearly
      ? "STRIPE_PRICE_PRO_PLUS_YEARLY"
      : "STRIPE_PRICE_PRO_PLUS_MONTHLY";
  return process.env[key];
}

export function planFromPriceId(priceId: string) {
  return PRICE_MAP[priceId];
}

export function checksLimitForPlan(plan: PlanId): number {
  return plan === "pro_plus" ? 999_999 : 100;
}
