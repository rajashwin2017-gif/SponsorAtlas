const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { stripe, priceIdFor, planFromPriceId } = require("../lib/stripe");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// ── Checkout ─────────────────────────────────────────────────────────────
const checkoutSchema = z.object({
  plan: z.enum(["pro", "pro_plus"]),
  yearly: z.boolean().default(false),
});

router.post(
  "/checkout",
  requireUser,
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured. Add STRIPE_SECRET_KEY to your .env file.", 503);

    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError("Invalid plan selection", 400);

    const { plan, yearly } = parsed.data;
    const priceId = priceIdFor(plan, yearly);
    if (!priceId) throw new ApiError("This plan is not configured yet", 400);

    let customerId = req.user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name || undefined,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, req.user.id]);
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: req.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/dashboard?upgraded=1`,
      cancel_url: `${clientUrl}/pricing?cancelled=1`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: req.user.id } },
    });

    res.json({ url: checkoutSession.url });
  })
);

// ── Customer portal ──────────────────────────────────────────────────────
router.post(
  "/portal",
  requireUser,
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured.", 503);
    if (!req.user.stripe_customer_id) throw new ApiError("You don't have a billing account yet. Subscribe to a plan first.", 400);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe_customer_id,
      return_url: `${clientUrl}/dashboard`,
    });

    res.json({ url: portalSession.url });
  })
);

// ── Webhook ──────────────────────────────────────────────────────────────
// Mounted with express.raw() in app.js (not express.json()) so the raw body
// is available for Stripe's signature verification.
router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) return res.status(503).json({ error: "Stripe not configured" });

    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (typeof session.subscription === "string") {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            await syncSubscription(subscription);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await syncSubscription(event.data.object);
          break;
        case "customer.subscription.deleted":
          await markSubscriptionCanceled(event.data.object);
          break;
        case "invoice.paid":
          await recordInvoiceAndPayment(event.data.object, "paid");
          break;
        case "invoice.payment_failed":
          await recordInvoiceAndPayment(event.data.object, "failed");
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Error handling Stripe webhook event ${event.type}:`, err);
      return res.status(500).json({ error: "Webhook handler error" });
    }

    res.json({ received: true });
  })
);

async function findUserByCustomerId(customerId) {
  const { rows } = await pool.query("SELECT * FROM users WHERE stripe_customer_id = $1", [customerId]);
  return rows[0];
}

async function syncSubscription(subscription) {
  const customerId = subscription.customer;
  const userIdFromMetadata = subscription.metadata?.userId;
  let user;
  if (userIdFromMetadata) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userIdFromMetadata]);
    user = rows[0];
  } else {
    user = await findUserByCustomerId(customerId);
  }
  if (!user) return;

  const priceId = subscription.items.data[0]?.price.id;
  const mapped = priceId ? planFromPriceId(priceId) : undefined;
  const plan = mapped?.plan || "pro";
  const interval = mapped?.interval || "month";
  const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_price_id, plan, interval, status, current_period_end, cancel_at_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (stripe_subscription_id) DO UPDATE SET
       stripe_price_id = EXCLUDED.stripe_price_id,
       plan = EXCLUDED.plan,
       interval = EXCLUDED.interval,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       updated_at = now()`,
    [uuidv4(), user.id, subscription.id, priceId || "", plan, interval, subscription.status, periodEnd, subscription.cancel_at_period_end]
  );

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  await pool.query(
    `UPDATE users SET subscription_tier = $1, subscription_status = $2, stripe_customer_id = $3, stripe_subscription_id = $4, updated_at = now()
     WHERE id = $5`,
    [isActive ? plan : "free", subscription.status, customerId, subscription.id, user.id]
  );
}

async function markSubscriptionCanceled(subscription) {
  const user = await findUserByCustomerId(subscription.customer);
  if (!user) return;

  await pool.query("UPDATE subscriptions SET status = 'canceled', updated_at = now() WHERE stripe_subscription_id = $1", [
    subscription.id,
  ]);
  await pool.query(
    "UPDATE users SET subscription_tier = 'free', subscription_status = 'canceled', updated_at = now() WHERE id = $1",
    [user.id]
  );
}

async function recordInvoiceAndPayment(invoice, outcome) {
  const user = await findUserByCustomerId(invoice.customer);
  if (!user) return;

  const amount = invoice.amount_paid || invoice.amount_due;
  const status = invoice.status || (outcome === "paid" ? "paid" : "open");

  await pool.query(
    `INSERT INTO invoices (id, user_id, stripe_invoice_id, amount, currency, status, hosted_invoice_url, pdf_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (stripe_invoice_id) DO UPDATE SET
       amount = EXCLUDED.amount,
       status = EXCLUDED.status,
       hosted_invoice_url = EXCLUDED.hosted_invoice_url,
       pdf_url = EXCLUDED.pdf_url`,
    [uuidv4(), user.id, invoice.id, amount, invoice.currency, status, invoice.hosted_invoice_url || null, invoice.invoice_pdf || null]
  );

  // Webhooks can be redelivered by Stripe; skip creating a duplicate Payment
  // row for an invoice we've already recorded a payment against.
  const { rows: existing } = await pool.query("SELECT id FROM payments WHERE stripe_invoice_id = $1", [invoice.id]);
  if (existing.length === 0) {
    const paymentIntentId = invoice.payment_intent;
    await pool.query(
      `INSERT INTO payments (id, user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        user.id,
        typeof paymentIntentId === "string" ? paymentIntentId : null,
        invoice.id,
        amount,
        invoice.currency,
        outcome === "paid" ? "succeeded" : "failed",
      ]
    );
  }

  if (outcome === "failed") {
    await pool.query("UPDATE users SET subscription_status = 'past_due', updated_at = now() WHERE id = $1", [user.id]);
  }
}

module.exports = router;
