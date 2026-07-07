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
      await pool.execute("UPDATE users SET stripe_customer_id = ? WHERE id = ?", [customerId, req.user.id]);
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
  const [rows] = await pool.execute("SELECT * FROM users WHERE stripe_customer_id = ?", [customerId]);
  return rows[0];
}

async function syncSubscription(subscription) {
  const customerId = subscription.customer;
  const userIdFromMetadata = subscription.metadata?.userId;
  let user;
  if (userIdFromMetadata) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [userIdFromMetadata]);
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

  await pool.execute(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_price_id, plan, \`interval\`, status, current_period_end, cancel_at_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stripe_price_id = VALUES(stripe_price_id),
       plan = VALUES(plan),
       \`interval\` = VALUES(\`interval\`),
       status = VALUES(status),
       current_period_end = VALUES(current_period_end),
       cancel_at_period_end = VALUES(cancel_at_period_end)`,
    [uuidv4(), user.id, subscription.id, priceId || "", plan, interval, subscription.status, periodEnd, subscription.cancel_at_period_end ? 1 : 0]
  );

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  await pool.execute(
    `UPDATE users SET subscription_tier = ?, subscription_status = ?, stripe_customer_id = ?, stripe_subscription_id = ?
     WHERE id = ?`,
    [isActive ? plan : "free", subscription.status, customerId, subscription.id, user.id]
  );
}

async function markSubscriptionCanceled(subscription) {
  const user = await findUserByCustomerId(subscription.customer);
  if (!user) return;

  await pool.execute("UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?", [subscription.id]);
  await pool.execute("UPDATE users SET subscription_tier = 'free', subscription_status = 'canceled' WHERE id = ?", [
    user.id,
  ]);
}

async function recordInvoiceAndPayment(invoice, outcome) {
  const user = await findUserByCustomerId(invoice.customer);
  if (!user) return;

  const amount = invoice.amount_paid || invoice.amount_due;
  const status = invoice.status || (outcome === "paid" ? "paid" : "open");

  await pool.execute(
    `INSERT INTO invoices (id, user_id, stripe_invoice_id, amount, currency, status, hosted_invoice_url, pdf_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       amount = VALUES(amount),
       status = VALUES(status),
       hosted_invoice_url = VALUES(hosted_invoice_url),
       pdf_url = VALUES(pdf_url)`,
    [uuidv4(), user.id, invoice.id, amount, invoice.currency, status, invoice.hosted_invoice_url || null, invoice.invoice_pdf || null]
  );

  // Webhooks can be redelivered by Stripe; skip creating a duplicate Payment
  // row for an invoice we've already recorded a payment against.
  const [existing] = await pool.execute("SELECT id FROM payments WHERE stripe_invoice_id = ?", [invoice.id]);
  if (existing.length === 0) {
    const paymentIntentId = invoice.payment_intent;
    await pool.execute(
      `INSERT INTO payments (id, user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
    await pool.execute("UPDATE users SET subscription_status = 'past_due' WHERE id = ?", [user.id]);
  }
}

module.exports = router;
