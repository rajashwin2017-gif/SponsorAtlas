import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe, getPlanFromPriceId, checksLimitForPlan } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const sessionUser = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

    if (!user.stripeCustomerId) {
      return NextResponse.json({ synced: false, reason: "no_customer" });
    }

    // Fetch the most recent active/trialing subscription from Stripe directly.
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const subscription = subscriptions.data[0];
    if (!subscription) {
      return NextResponse.json({ synced: false, reason: "no_active_subscription" });
    }

    const priceId = subscription.items.data[0]?.price.id;
    const mapped = priceId ? await getPlanFromPriceId(priceId) : undefined;
    const plan = mapped?.plan ?? "pro";
    const interval = mapped?.interval ?? "month";
    const periodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId ?? "",
        plan,
        interval,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripePriceId: priceId ?? "",
        plan,
        interval,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: plan,
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscription.id,
        monthlyChecksLimit: checksLimitForPlan(plan),
      },
    });

    return NextResponse.json({ synced: true, plan, status: subscription.status });
  } catch (err) {
    return handleApiError(err);
  }
}
