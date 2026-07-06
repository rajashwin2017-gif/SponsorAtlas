import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const admin = await requireAdmin();
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: params.id } });

    if (payment.status === "refunded") {
      throw new ApiError("This payment has already been refunded", 400);
    }
    if (!payment.stripePaymentIntentId) {
      throw new ApiError("This payment has no associated Stripe payment intent to refund", 400);
    }

    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });

    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: { status: "refunded" },
    });

    await logAudit(admin.id, "payment.refund", "Payment", payment.id, { amount: payment.amount });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
