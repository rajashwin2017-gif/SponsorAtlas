import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { PLANS } from "@/lib/pricing";

function priceToNumber(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}

const MONTHLY_PRICE: Record<string, number> = {};
const YEARLY_PRICE: Record<string, number> = {};
for (const plan of PLANS) {
  MONTHLY_PRICE[plan.id] = priceToNumber(plan.monthlyPrice);
  YEARLY_PRICE[plan.id] = priceToNumber(plan.yearlyPrice);
}

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeSubscribers,
      monthlySubscriptions,
      yearlySubscriptions,
      cancelledSubscriptions,
      trialSubscriptions,
      recentRegistrations,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionStatus: "active" } }),
      prisma.subscription.findMany({ where: { interval: "month", status: "active" }, select: { plan: true } }),
      prisma.subscription.findMany({ where: { interval: "year", status: "active" }, select: { plan: true } }),
      prisma.subscription.count({ where: { status: "canceled" } }),
      prisma.subscription.count({ where: { status: "trialing" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const mrr =
      monthlySubscriptions.reduce((sum, s) => sum + (MONTHLY_PRICE[s.plan] ?? 0), 0) +
      yearlySubscriptions.reduce((sum, s) => sum + (YEARLY_PRICE[s.plan] ?? 0) / 12, 0);

    return NextResponse.json({
      totalUsers,
      activeSubscribers,
      monthlySubscribers: monthlySubscriptions.length,
      yearlySubscribers: yearlySubscriptions.length,
      cancelledSubscriptions,
      trialUsers: trialSubscriptions,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      recentRegistrations,
      recentPayments,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
