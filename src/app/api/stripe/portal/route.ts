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

    if (!user.stripeCustomerId) {
      throw new ApiError("You don't have a billing account yet. Subscribe to a plan first.", 400);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    return handleApiError(err);
  }
}
