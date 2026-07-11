import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe, getPlanPriceId } from "@/lib/stripe";
import { handleApiError, ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.string().min(1, "Plan is required"),
  yearly: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file." },
        { status: 503 }
      );
    }

    const sessionUser = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Invalid plan selection", 400);
    }

    const { plan, yearly } = parsed.data;
    const priceId = await getPlanPriceId(plan, yearly);
    if (!priceId) {
      throw new ApiError("This plan isn't available for checkout yet", 400);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

    // Reuse an existing Stripe customer for this user instead of letting
    // Checkout create a new one each time, so billing history stays unified.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/pricing?cancelled=1`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: user.id } },
      // Present prices in the customer's local currency (e.g. INR for India).
      // Requires Adaptive Pricing to be enabled in Stripe Dashboard →
      // Settings → Adaptive pricing. Without it this field is ignored.
      currency_conversion: { enabled: true } as object,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    return handleApiError(err);
  }
}
