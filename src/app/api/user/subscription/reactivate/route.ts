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
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

    if (!user.stripeSubscriptionId) {
      throw new ApiError("No subscription to reactivate", 400);
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end });
  } catch (err) {
    return handleApiError(err);
  }
}
