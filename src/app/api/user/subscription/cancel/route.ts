import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";

// Cancels at the end of the current billing period so the member keeps
// access they've already paid for. DB is updated by the
// customer.subscription.updated webhook once Stripe confirms the change.
export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const sessionUser = await requireUser();

    // Look up the active subscription row rather than relying on
    // user.stripeSubscriptionId, which can point to a stale/old sub
    // for returning subscribers who re-subscribed.
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: sessionUser.id,
        status: { in: ["active", "trialing"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSub) {
      throw new ApiError("No active subscription to cancel", 400);
    }

    const subscription = await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end });
  } catch (err) {
    return handleApiError(err);
  }
}
