const express = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { stripe } = require("../lib/stripe");
const { mapUser, mapInvoice } = require("../lib/mappers");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { requireUser } = require("../middleware/auth");

const router = express.Router();
router.use(requireUser);

router.get("/profile", (req, res) => {
  res.json(mapUser(req.user));
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
  alertFrequency: z.enum(["daily", "weekly", "none"]).optional(),
});

router.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const fields = [];
    const values = [];
    if (parsed.data.name !== undefined) {
      fields.push("name = ?");
      values.push(parsed.data.name);
    }
    if (parsed.data.alertFrequency !== undefined) {
      fields.push("alert_frequency = ?");
      values.push(parsed.data.alertFrequency);
    }
    if (fields.length === 0) return res.json(mapUser(req.user));

    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json(mapUser(rows[0]));
  })
);

router.get(
  "/subscription",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );
    const subscription = rows[0];

    res.json({
      tier: req.user.subscription_tier,
      status: req.user.subscription_status,
      hasBillingAccount: Boolean(req.user.stripe_customer_id),
      plan: subscription?.plan ?? null,
      interval: subscription?.interval ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    });
  })
);

router.post(
  "/subscription/cancel",
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured.", 503);
    if (!req.user.stripe_subscription_id) throw new ApiError("No active subscription to cancel", 400);

    const subscription = await stripe.subscriptions.update(req.user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    res.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end });
  })
);

router.post(
  "/subscription/reactivate",
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured.", 503);
    if (!req.user.stripe_subscription_id) throw new ApiError("No subscription to reactivate", 400);

    const subscription = await stripe.subscriptions.update(req.user.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    res.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end });
  })
);

router.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute("SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC", [
      req.user.id,
    ]);
    res.json(rows.map(mapInvoice));
  })
);

module.exports = router;
