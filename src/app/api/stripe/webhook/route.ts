import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, planFromPriceId } from "@/lib/stripe";

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const userIdFromMetadata = subscription.metadata?.userId;
  const user = userIdFromMetadata
    ? await prisma.user.findUnique({ where: { id: userIdFromMetadata } })
    : await findUserByCustomerId(customerId);
  if (!user) return;

  const priceId = subscription.items.data[0]?.price.id;
  const mapped = priceId ? planFromPriceId(priceId) : undefined;
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

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: isActive ? plan : "free",
      subscriptionStatus: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    },
  });
}

async function markSubscriptionCanceled(subscription: Stripe.Subscription) {
  const user = await findUserByCustomerId(subscription.customer as string);
  if (!user) return;

  await prisma.subscription
    .update({ where: { stripeSubscriptionId: subscription.id }, data: { status: "canceled" } })
    .catch(() => {});

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: "free", subscriptionStatus: "canceled" },
  });
}

async function recordInvoiceAndPayment(invoice: Stripe.Invoice, outcome: "paid" | "failed") {
  const user = await findUserByCustomerId(invoice.customer as string);
  if (!user) return;

  const amount = invoice.amount_paid || invoice.amount_due;

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      amount,
      currency: invoice.currency,
      status: invoice.status ?? (outcome === "paid" ? "paid" : "open"),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      pdfUrl: invoice.invoice_pdf ?? undefined,
    },
    update: {
      amount,
      status: invoice.status ?? (outcome === "paid" ? "paid" : "open"),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      pdfUrl: invoice.invoice_pdf ?? undefined,
    },
  });

  // Webhooks can be redelivered by Stripe; skip creating a duplicate Payment
  // row for an invoice we've already recorded a payment against.
  const existingPayment = await prisma.payment.findFirst({ where: { stripeInvoiceId: invoice.id } });
  if (!existingPayment) {
    // `payment_intent` was removed from the top-level Invoice type in recent
    // Stripe API versions (moved to the expandable `payments` list); read it
    // defensively so this keeps working across API version differences.
    const paymentIntentId = (invoice as any).payment_intent;
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripePaymentIntentId: typeof paymentIntentId === "string" ? paymentIntentId : undefined,
        stripeInvoiceId: invoice.id,
        amount,
        currency: invoice.currency,
        status: outcome === "paid" ? "succeeded" : "failed",
      },
    });
  }

  if (outcome === "failed") {
    await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: "past_due" } });
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await markSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid": {
        await recordInvoiceAndPayment(event.data.object as Stripe.Invoice, "paid");
        break;
      }
      case "invoice.payment_failed": {
        await recordInvoiceAndPayment(event.data.object as Stripe.Invoice, "failed");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe webhook event ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
