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

    const activeSub = await prisma.subscription.findFirst({
      where: { userId: sessionUser.id, status: { in: ["active", "trialing"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!activeSub) {
      throw new ApiError(
        "No active subscription found. Please subscribe first via the pricing page.",
        400
      );
    }

    const stripeSub = await stripe.subscriptions.retrieve(activeSub.stripeSubscriptionId);
    const currentItem = stripeSub.items.data[0];
    if (!currentItem) {
      throw new ApiError("Could not retrieve current subscription details from Stripe.", 500);
    }

    // Resolve both plans from DB. Fail explicitly if either is missing so
    // isUpgrade never silently defaults to false and skips the payment check.
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

    if (!newPlan) {
      throw new ApiError(`Plan "${plan}" not found. Please contact support.`, 400);
    }

    const isUpgrade =
      (newPlan.monthlyPriceMinor ?? 0) > (currentPlan?.monthlyPriceMinor ?? 0);

    // For upgrades, use error_if_incomplete so Stripe atomically rejects the
    // subscription change if payment fails — no manual rollback needed or safe.
    // For downgrades, pending_if_incomplete is fine (no immediate charge).
    const updated = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: isUpgrade ? "always_invoice" : "create_prorations",
      payment_behavior: isUpgrade ? "error_if_incomplete" : "pending_if_incomplete",
    });

    // For upgrades, double-check the proration invoice is actually paid.
    // We expand latest_invoice on the freshly-fetched subscription (not the
    // update response) to avoid the race where the update response still
    // carries the previous invoice ID.
    if (isUpgrade) {
      const freshSub = await stripe.subscriptions.retrieve(updated.id, {
        expand: ["latest_invoice"],
      });
      const invoice = freshSub.latest_invoice as import("stripe").Stripe.Invoice | null;

      if (!invoice || invoice.status !== "paid") {
        // payment_behavior: error_if_incomplete should have already thrown,
        // but guard here as a second line of defence.
        throw new ApiError(
          "Payment for the upgrade could not be processed. Please update your payment method and try again.",
          402
        );
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
