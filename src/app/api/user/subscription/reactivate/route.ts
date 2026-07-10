import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const sessionUser = await requireUser();

    // Find the subscription pending cancellation (active but cancel_at_period_end=true).
    const pendingCancelSub = await prisma.subscription.findFirst({
      where: {
        userId: sessionUser.id,
        status: { in: ["active", "trialing"] },
        cancelAtPeriodEnd: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingCancelSub) {
      throw new ApiError("No subscription pending cancellation to reactivate", 400);
    }

    const subscription = await stripe.subscriptions.update(pendingCancelSub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end });
  } catch (err) {
    return handleApiError(err);
  }
}
