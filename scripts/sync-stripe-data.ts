/**
 * scripts/sync-stripe-data.ts
 *
 * Pulls real customers, subscriptions, invoices and charges from Stripe
 * and upserts them into the local database.
 *
 * Run:  npx tsx scripts/sync-stripe-data.ts
 */

import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("❌  STRIPE_SECRET_KEY is not set in .env");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

async function findOrLinkUser(customer: Stripe.Customer) {
  // 1. Already linked by stripeCustomerId
  let user = await prisma.user.findFirst({ where: { stripeCustomerId: customer.id } });
  if (user) return user;

  // 2. Match by email
  if (customer.email) {
    user = await prisma.user.findUnique({
      where: { email: customer.email.toLowerCase() },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
      return user;
    }

    // 3. No matching user — create one from Stripe customer data
    user = await prisma.user.create({
      data: {
        email: customer.email.toLowerCase(),
        name: customer.name ?? null,
        stripeCustomerId: customer.id,
        // emailVerified stays null — they haven't gone through our auth flow
      },
    });
    console.log(`      ➕  Created new user for ${customer.email}`);
    return user;
  }

  return null;
}

async function planFromMetadataOrPrice(
  sub: Stripe.Subscription,
  priceId: string
): Promise<{ plan: string; interval: "month" | "year" }> {
  const price = sub.items.data[0]?.price;
  const interval: "month" | "year" =
    price?.recurring?.interval === "year" ? "year" : "month";

  // 1. Metadata set by our checkout (most reliable — added since July 2026)
  const planMeta = sub.metadata?.plan;
  if (planMeta) return { plan: planMeta, interval };

  // 2. Look up the price ID in our plans table
  if (priceId) {
    const dbPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripeMonthlyPriceId: priceId },
          { stripeYearlyPriceId: priceId },
        ],
      },
    });
    if (dbPlan) return { plan: dbPlan.planId, interval };
  }

  // 3. Infer from price nickname
  const nick = (price?.nickname ?? "").toLowerCase();
  if (nick.includes("plus") || nick.includes("pro+")) return { plan: "pro_plus", interval };
  if (nick.includes("pro")) return { plan: "pro", interval };

  // 4. Last resort
  return { plan: "pro", interval };
}

// --------------------------------------------------------------------------
// Sync subscriptions for a customer
// --------------------------------------------------------------------------

async function syncSubscriptions(userId: string, customerId: string) {
  let count = 0;
  for await (const sub of stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    expand: ["data.items.data.price"],
  })) {
    const priceId = sub.items.data[0]?.price.id ?? "";
    const { plan, interval } = await planFromMetadataOrPrice(sub, priceId);
    const periodEnd = (sub as any).current_period_end
      ? new Date((sub as any).current_period_end * 1000)
      : null;
    const isActive = sub.status === "active" || sub.status === "trialing";

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: {
        userId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        plan,
        interval,
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        createdAt: new Date(sub.created * 1000),
      },
      update: {
        stripePriceId: priceId,
        plan,
        interval,
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

    // Keep user tier in sync with most recent active subscription
    if (isActive) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: plan,
          subscriptionStatus: sub.status,
          stripeSubscriptionId: sub.id,
        },
      });
    }

    count++;
  }
  return count;
}

// --------------------------------------------------------------------------
// Sync invoices + payments for a customer
// --------------------------------------------------------------------------

async function syncInvoices(userId: string, customerId: string) {
  let invCount = 0;
  let payCount = 0;

  for await (const inv of stripe.invoices.list({
    customer: customerId,
    limit: 100,
  })) {
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: inv.id },
      create: {
        userId,
        stripeInvoiceId: inv.id,
        amount: inv.amount_paid || inv.amount_due,
        currency: inv.currency,
        status: inv.status ?? "open",
        hostedInvoiceUrl: inv.hosted_invoice_url ?? undefined,
        pdfUrl: inv.invoice_pdf ?? undefined,
        createdAt: new Date(inv.created * 1000),
      },
      update: {
        amount: inv.amount_paid || inv.amount_due,
        status: inv.status ?? "open",
        hostedInvoiceUrl: inv.hosted_invoice_url ?? undefined,
        pdfUrl: inv.invoice_pdf ?? undefined,
      },
    });
    invCount++;

    // Payment row for paid invoices
    if (inv.status === "paid" && (inv.amount_paid ?? 0) > 0) {
      const existing = await prisma.payment.findFirst({
        where: { stripeInvoiceId: inv.id },
      });
      if (!existing) {
        const piId = (inv as any).payment_intent;
        await prisma.payment.create({
          data: {
            userId,
            stripePaymentIntentId: typeof piId === "string" ? piId : undefined,
            stripeInvoiceId: inv.id,
            amount: inv.amount_paid,
            currency: inv.currency,
            status: "succeeded",
            createdAt: new Date(inv.created * 1000),
          },
        });
        payCount++;
      }
    }
  }

  return { invCount, payCount };
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  console.log("🔄  Syncing Stripe data into database…\n");

  let customersProcessed = 0;
  let customersSkipped = 0;
  let totalSubs = 0;
  let totalInvoices = 0;
  let totalPayments = 0;

  for await (const customer of stripe.customers.list({ limit: 100 })) {
    if (customer.deleted) continue;

    const user = await findOrLinkUser(customer);
    if (!user) {
      console.log(`  ⚠  No DB user for customer ${customer.id} (${customer.email ?? "no email"}) — skipping`);
      customersSkipped++;
      continue;
    }

    console.log(`  👤  ${customer.email ?? customer.id} → user ${user.id}`);

    const subs = await syncSubscriptions(user.id, customer.id);
    const { invCount, payCount } = await syncInvoices(user.id, customer.id);

    totalSubs += subs;
    totalInvoices += invCount;
    totalPayments += payCount;
    customersProcessed++;

    console.log(`      subscriptions: ${subs}  invoices: ${invCount}  payments: ${payCount}`);
  }

  console.log(`
✅  Stripe sync complete
    Customers processed : ${customersProcessed}
    Customers skipped   : ${customersSkipped} (no matching DB user)
    Subscriptions       : ${totalSubs}
    Invoices            : ${totalInvoices}
    Payments            : ${totalPayments}
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
