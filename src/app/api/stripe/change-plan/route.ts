import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe, getPlanPriceId, checksLimitForPlan } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";
import { sendPlanChangedEmail } from "@/lib/email";

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
      payment_behavior: "pending_if_incomplete",
    });

    // For upgrades, verify the proration invoice was actually paid before
    // granting access. If payment is still pending, reject and tell the user
    // to update their payment method.
    if (isUpgrade) {
      const latestInvoiceId = (updated as any).latest_invoice;
      if (typeof latestInvoiceId === "string") {
        const invoice = await stripe.invoices.retrieve(latestInvoiceId);
        if (invoice.status !== "paid") {
          // Roll back the Stripe subscription item to the previous price.
          await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
            items: [{ id: updated.items.data[0]?.id, price: currentItem.price.id }],
            proration_behavior: "none",
          }).catch(() => {});
          throw new ApiError(
            "Payment for the upgrade could not be processed. Please update your payment method and try again.",
            402
          );
        }
      }
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: activeSub.stripeSubscriptionId },
      data: {
        plan,
        stripePriceId: newPriceId,
        interval: yearly ? "year" : "month",
        status: updated.status,
      },
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    const oldPlan = activeSub.plan;

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        subscriptionTier: plan,
        stripeSubscriptionId: updated.id,
        monthlyChecksLimit: checksLimitForPlan(plan),
      },
    });

    // Send plan-change confirmation email (fire-and-forget — don't block the response).
    sendPlanChangedEmail(user.email, {
      name: user.name,
      oldPlan,
      newPlan: plan,
      interval: yearly ? "year" : "month",
    }).catch((err) => console.error("Failed to send plan-changed email:", err));

    return NextResponse.json({ success: true, plan, interval: yearly ? "year" : "month" });
  } catch (err) {
    return handleApiError(err);
  }
}
