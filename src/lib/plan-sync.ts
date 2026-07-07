import { stripe } from "@/lib/stripe";

interface PlanSyncInput {
  name: string;
  monthlyPriceMinor: number;
  yearlyPriceMinor: number;
}

interface PlanSyncExisting {
  name: string;
  monthlyPriceMinor: number;
  yearlyPriceMinor: number;
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
}

interface PlanSyncResult {
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
}

// Creates/updates the Stripe Product + two recurring Prices (monthly/yearly)
// for a plan. Stripe Prices are immutable once created, so a changed amount
// archives the old price and creates a new one rather than editing in
// place. Returns the existing (possibly still-null) IDs unchanged if Stripe
// isn't configured — callers treat that as "draft, not yet synced".
export async function syncPlanToStripe(
  existing: PlanSyncExisting | null,
  input: PlanSyncInput
): Promise<PlanSyncResult> {
  if (!stripe) {
    return {
      stripeProductId: existing?.stripeProductId ?? null,
      stripeMonthlyPriceId: existing?.stripeMonthlyPriceId ?? null,
      stripeYearlyPriceId: existing?.stripeYearlyPriceId ?? null,
    };
  }

  let productId = existing?.stripeProductId ?? null;
  if (!productId) {
    const product = await stripe.products.create({ name: input.name });
    productId = product.id;
  } else if (existing?.name !== input.name) {
    await stripe.products.update(productId, { name: input.name });
  }

  let monthlyPriceId = existing?.stripeMonthlyPriceId ?? null;
  if (!monthlyPriceId || existing?.monthlyPriceMinor !== input.monthlyPriceMinor) {
    if (monthlyPriceId) await stripe.prices.update(monthlyPriceId, { active: false });
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: input.monthlyPriceMinor,
      currency: "gbp",
      recurring: { interval: "month" },
    });
    monthlyPriceId = price.id;
  }

  let yearlyPriceId = existing?.stripeYearlyPriceId ?? null;
  if (!yearlyPriceId || existing?.yearlyPriceMinor !== input.yearlyPriceMinor) {
    if (yearlyPriceId) await stripe.prices.update(yearlyPriceId, { active: false });
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: input.yearlyPriceMinor,
      currency: "gbp",
      recurring: { interval: "year" },
    });
    yearlyPriceId = price.id;
  }

  return { stripeProductId: productId, stripeMonthlyPriceId: monthlyPriceId, stripeYearlyPriceId: yearlyPriceId };
}

// Archives (deactivates) a plan's Stripe Product/Prices. Stripe won't allow
// hard-deleting Prices that have usage history, so "archive" (active:false)
// is the correct terminal state — existing subscriptions keep working.
export async function archivePlanInStripe(existing: PlanSyncExisting) {
  if (!stripe) return;
  if (existing.stripeMonthlyPriceId) {
    await stripe.prices.update(existing.stripeMonthlyPriceId, { active: false }).catch(() => {});
  }
  if (existing.stripeYearlyPriceId) {
    await stripe.prices.update(existing.stripeYearlyPriceId, { active: false }).catch(() => {});
  }
  if (existing.stripeProductId) {
    await stripe.products.update(existing.stripeProductId, { active: false }).catch(() => {});
  }
}
