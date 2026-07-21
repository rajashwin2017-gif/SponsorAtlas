import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe, getPlanPriceId } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.string().min(1),
  yearly: z.boolean().default(false),
});

// Returns the immediate proration charge before the user confirms the upgrade.
// This lets the UI show "You'll be charged £X now" before any Stripe mutation.
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
      throw new ApiError("Plan not available for checkout yet.", 400);
    }

    const activeSub = await prisma.subscription.findFirst({
      where: { userId: sessionUser.id, status: { in: ["active", "trialing"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!activeSub) {
      throw new ApiError("No active subscription found.", 400);
    }

    const stripeSub = await stripe.subscriptions.retrieve(activeSub.stripeSubscriptionId);
    const currentItem = stripeSub.items.data[0];
    if (!currentItem) {
      throw new ApiError("Could not retrieve subscription details.", 500);
    }

    // Detect upgrade vs downgrade from DB prices so we never rely on fallback 0.
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
      throw new ApiError(`Plan "${plan}" not found.`, 400);
    }

    const isUpgrade =
      (newPlan.monthlyPriceMinor ?? 0) > (currentPlan?.monthlyPriceMinor ?? 0);

    if (!isUpgrade) {
      // Downgrades don't charge immediately — no preview needed.
      return NextResponse.json({ isUpgrade: false, amountDue: 0, currency: "gbp" });
    }

    // Calculate exactly what Stripe will charge right now using the preview API.
    const previewInvoice = await stripe.invoices.createPreview({
      customer: stripeSub.customer as string,
      subscription: activeSub.stripeSubscriptionId,
      subscription_details: {
        items: [{ id: currentItem.id, price: newPriceId }],
        proration_behavior: "always_invoice",
      },
    });

    const amountDue = previewInvoice.amount_due; // in minor units (pence)
    const currency = previewInvoice.currency;

    return NextResponse.json({ isUpgrade: true, amountDue, currency });
  } catch (err) {
    return handleApiError(err);
  }
}
