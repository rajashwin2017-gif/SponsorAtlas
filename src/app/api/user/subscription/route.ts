import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const sessionUser = await requireUser();

    const [user, subscription] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: sessionUser.id },
        select: { subscriptionTier: true, subscriptionStatus: true, stripeCustomerId: true },
      }),
      prisma.subscription.findFirst({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      hasBillingAccount: Boolean(user.stripeCustomerId),
      plan: subscription?.plan ?? null,
      interval: subscription?.interval ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
