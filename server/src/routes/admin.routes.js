const express = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { stripe } = require("../lib/stripe");
const { PLANS } = require("../lib/pricing");
const { mapUser, mapSubscription, mapPayment } = require("../lib/mappers");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { requireAdmin } = require("../middleware/auth");
const { logAudit } = require("../lib/audit");

const router = express.Router();
router.use(requireAdmin);

function priceToNumber(price) {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}
const MONTHLY_PRICE = {};
const YEARLY_PRICE = {};
for (const plan of PLANS) {
  MONTHLY_PRICE[plan.id] = priceToNumber(plan.monthlyPrice);
  YEARLY_PRICE[plan.id] = priceToNumber(plan.yearlyPrice);
}

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [
      totalUsersResult,
      activeSubscribersResult,
      monthlySubsResult,
      yearlySubsResult,
      cancelledResult,
      trialResult,
      recentRegsResult,
      recentPaymentsResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE subscription_status = 'active'"),
      pool.query("SELECT plan FROM subscriptions WHERE interval = 'month' AND status = 'active'"),
      pool.query("SELECT plan FROM subscriptions WHERE interval = 'year' AND status = 'active'"),
      pool.query("SELECT COUNT(*)::int AS count FROM subscriptions WHERE status = 'canceled'"),
      pool.query("SELECT COUNT(*)::int AS count FROM subscriptions WHERE status = 'trialing'"),
      pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      pool.query(
        `SELECT p.*, u.name AS user_name, u.email AS user_email
         FROM payments p JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT 10`
      ),
    ]);

    const mrr =
      monthlySubsResult.rows.reduce((sum, s) => sum + (MONTHLY_PRICE[s.plan] || 0), 0) +
      yearlySubsResult.rows.reduce((sum, s) => sum + (YEARLY_PRICE[s.plan] || 0) / 12, 0);

    res.json({
      totalUsers: totalUsersResult.rows[0].count,
      activeSubscribers: activeSubscribersResult.rows[0].count,
      monthlySubscribers: monthlySubsResult.rows.length,
      yearlySubscribers: yearlySubsResult.rows.length,
      cancelledSubscriptions: cancelledResult.rows[0].count,
      trialUsers: trialResult.rows[0].count,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      recentRegistrations: recentRegsResult.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        createdAt: r.created_at,
      })),
      recentPayments: recentPaymentsResult.rows.map(mapPayment),
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { search, role, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const conditions = [];
    const values = [];
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }
    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM users ${where}`, values);

    values.push(pageSize, (page - 1) * pageSize);
    const { rows } = await pool.query(
      `SELECT id, name, email, role, status, subscription_tier, subscription_status, email_verified, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({
      users: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        subscriptionTier: r.subscription_tier,
        subscriptionStatus: r.subscription_status,
        emailVerified: r.email_verified,
        createdAt: r.created_at,
      })),
      total: countRows[0].count,
      page,
      pageSize,
    });
  })
);

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    if (req.params.id === req.user.id && (parsed.data.role === "MEMBER" || parsed.data.status === "suspended")) {
      throw new ApiError("You cannot demote or suspend your own account", 400);
    }

    const { rows: beforeRows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    const before = beforeRows[0];
    if (!before) throw new ApiError("User not found", 404);

    const fields = [];
    const values = [];
    if (parsed.data.name !== undefined) {
      values.push(parsed.data.name);
      fields.push(`name = $${values.length}`);
    }
    if (parsed.data.role !== undefined) {
      values.push(parsed.data.role);
      fields.push(`role = $${values.length}`);
    }
    if (parsed.data.status !== undefined) {
      values.push(parsed.data.status);
      fields.push(`status = $${values.length}`);
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at = now() WHERE id = $${values.length}
       RETURNING id, name, email, role, status`,
      values
    );
    const user = rows[0];

    if (parsed.data.role && parsed.data.role !== before.role) {
      await logAudit(req.user.id, parsed.data.role === "ADMIN" ? "user.promote" : "user.demote", "User", user.id);
    }
    if (parsed.data.status && parsed.data.status !== before.status) {
      await logAudit(req.user.id, parsed.data.status === "suspended" ? "user.suspend" : "user.unsuspend", "User", user.id);
    }

    res.json(user);
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) throw new ApiError("You cannot delete your own account", 400);

    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    if (rowCount === 0) throw new ApiError("User not found", 404);

    await logAudit(req.user.id, "user.delete", "User", req.params.id);
    res.json({ success: true });
  })
);

router.get(
  "/subscriptions",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where = status ? "WHERE s.status = $1" : "";
    const values = status ? [status] : [];

    const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM subscriptions s ${where}`, values);

    values.push(pageSize, (page - 1) * pageSize);
    const { rows } = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({ subscriptions: rows.map(mapSubscription), total: countRows[0].count, page, pageSize });
  })
);

router.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where = status ? "WHERE p.status = $1" : "";
    const values = status ? [status] : [];

    const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM payments p ${where}`, values);

    values.push(pageSize, (page - 1) * pageSize);
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({ payments: rows.map(mapPayment), total: countRows[0].count, page, pageSize });
  })
);

router.post(
  "/payments/:id/refund",
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured.", 503);

    const { rows } = await pool.query("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    const payment = rows[0];
    if (!payment) throw new ApiError("Payment not found", 404);
    if (payment.status === "refunded") throw new ApiError("This payment has already been refunded", 400);
    if (!payment.stripe_payment_intent_id) throw new ApiError("This payment has no associated Stripe payment intent", 400);

    await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id });
    const { rows: updatedRows } = await pool.query(
      "UPDATE payments SET status = 'refunded' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    await logAudit(req.user.id, "payment.refund", "Payment", payment.id, { amount: payment.amount });

    res.json(mapPayment(updatedRows[0]));
  })
);

module.exports = router;
