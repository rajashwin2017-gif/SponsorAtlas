import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe, getPlanPriceId, checksLimitForPlan } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.string().min(1, "Plan is required"),
  yearly: z.boolean().default(false),
});

// Changes an existing active subscription's plan or billing interval in-place
// via stripe.subscriptions.update(). This avoids creating a second subscription
// (which would double-bill the customer). The webhook's
// customer.subscription.updated event will fire afterward and sync the DB.
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const sessionUser = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const { plan, yearly } = parsed.data;

    const newPriceId = await getPlanPriceId(plan, yearly);
    if (!newPriceId) {
      throw new ApiError(
        "This plan isn't available for checkout yet. Please contact support.",
        400
      );
    }

    // Find the user's current active subscription from the DB — more reliable
    // than user.stripeSubscriptionId which can be stale for returning subscribers.
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: sessionUser.id,
        status: { in: ["active", "trialing"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSub) {
      throw new ApiError(
        "No active subscription found. Please subscribe first via the pricing page.",
        400
      );
    }

    // Fetch the live Stripe subscription to get the current item ID.
    const stripeSub = await stripe.subscriptions.retrieve(activeSub.stripeSubscriptionId);
    const currentItem = stripeSub.items.data[0];
    if (!currentItem) {
      throw new ApiError("Could not retrieve current subscription details from Stripe.", 500);
    }

    // Upgrades charge the prorated difference immediately.
    // Downgrades apply a credit to the next invoice.
    const [newPlan, currentPlan] = await Promise.all([
      prisma.plan.findUnique({ where: { planId: plan } }),
      prisma.plan.findFirst({
        where: {
          OR: [
            { stripeMonthlyPriceId: currentItem.price.id },
            { stripeYearlyPriceId: currentItem.price.id },
          ],
        },
      }),
    ]);

    const isUpgrade = (newPlan?.monthlyPriceMinor ?? 0) > (currentPlan?.monthlyPriceMinor ?? 0);

    const updated = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: isUpgrade ? "always_invoice" : "create_prorations",
      // If the proration payment fails, keep the subscription active rather
      // than immediately canceling — Stripe will retry automatically.
      payment_behavior: "pending_if_incomplete",
    });

    // Optimistically update the DB so the billing panel reflects the change
    // immediately, before the webhook fires.
    await prisma.subscription.update({
      where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
      data: {
        plan,
        stripePriceId: newPriceId,
        interval: yearly ? "year" : "month",
        status: updated.status,
      },
    });

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        subscriptionTier: plan,
        stripeSubscriptionId: updated.id,
        monthlyChecksLimit: checksLimitForPlan(plan),
      },
    });

    return NextResponse.json({ success: true, plan, interval: yearly ? "year" : "month" });
  } catch (err) {
    return handleApiError(err);
  }
}
