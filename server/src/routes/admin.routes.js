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
      [totalUsersRows],
      [activeSubscribersRows],
      [monthlySubsRows],
      [yearlySubsRows],
      [cancelledRows],
      [trialRows],
      [recentRegsRows],
      [recentPaymentsRows],
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM users"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE subscription_status = 'active'"),
      pool.query("SELECT plan FROM subscriptions WHERE `interval` = 'month' AND status = 'active'"),
      pool.query("SELECT plan FROM subscriptions WHERE `interval` = 'year' AND status = 'active'"),
      pool.query("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'canceled'"),
      pool.query("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'trialing'"),
      pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      pool.query(
        `SELECT p.*, u.name AS user_name, u.email AS user_email
         FROM payments p JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT 10`
      ),
    ]);

    const mrr =
      monthlySubsRows.reduce((sum, s) => sum + (MONTHLY_PRICE[s.plan] || 0), 0) +
      yearlySubsRows.reduce((sum, s) => sum + (YEARLY_PRICE[s.plan] || 0) / 12, 0);

    res.json({
      totalUsers: Number(totalUsersRows[0].count),
      activeSubscribers: Number(activeSubscribersRows[0].count),
      monthlySubscribers: monthlySubsRows.length,
      yearlySubscribers: yearlySubsRows.length,
      cancelledSubscriptions: Number(cancelledRows[0].count),
      trialUsers: Number(trialRows[0].count),
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      recentRegistrations: recentRegsRows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        createdAt: r.created_at,
      })),
      recentPayments: recentPaymentsRows.map(mapPayment),
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
      conditions.push("(name LIKE ? OR email LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      conditions.push("role = ?");
      values.push(role);
    }
    if (status) {
      conditions.push("status = ?");
      values.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRows] = await pool.query(`SELECT COUNT(*) AS count FROM users ${where}`, values);

    // LIMIT/OFFSET are interpolated directly (not as ? placeholders) since
    // both are validated numbers above — mysql2 has known quirks binding
    // LIMIT/OFFSET as prepared-statement parameters.
    const [rows] = await pool.query(
      `SELECT id, name, email, role, status, subscription_tier, subscription_status, email_verified, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
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
      total: Number(countRows[0].count),
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

    const [beforeRows] = await pool.execute("SELECT * FROM users WHERE id = ?", [req.params.id]);
    const before = beforeRows[0];
    if (!before) throw new ApiError("User not found", 404);

    const fields = [];
    const values = [];
    if (parsed.data.name !== undefined) {
      fields.push("name = ?");
      values.push(parsed.data.name);
    }
    if (parsed.data.role !== undefined) {
      fields.push("role = ?");
      values.push(parsed.data.role);
    }
    if (parsed.data.status !== undefined) {
      fields.push("status = ?");
      values.push(parsed.data.status);
    }

    if (fields.length > 0) {
      values.push(req.params.id);
      await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    const [rows] = await pool.execute("SELECT id, name, email, role, status FROM users WHERE id = ?", [req.params.id]);
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

    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) throw new ApiError("User not found", 404);

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

    const where = status ? "WHERE s.status = ?" : "";
    const values = status ? [status] : [];

    const [countRows] = await pool.query(`SELECT COUNT(*) AS count FROM subscriptions s ${where}`, values);

    const [rows] = await pool.query(
      `SELECT s.*, u.id AS u_id, u.name AS user_name, u.email AS user_email
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      values
    );

    res.json({ subscriptions: rows.map(mapSubscription), total: Number(countRows[0].count), page, pageSize });
  })
);

router.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where = status ? "WHERE p.status = ?" : "";
    const values = status ? [status] : [];

    const [countRows] = await pool.query(`SELECT COUNT(*) AS count FROM payments p ${where}`, values);

    const [rows] = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      values
    );

    res.json({ payments: rows.map(mapPayment), total: Number(countRows[0].count), page, pageSize });
  })
);

router.post(
  "/payments/:id/refund",
  asyncHandler(async (req, res) => {
    if (!stripe) throw new ApiError("Stripe is not configured.", 503);

    const [rows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    const payment = rows[0];
    if (!payment) throw new ApiError("Payment not found", 404);
    if (payment.status === "refunded") throw new ApiError("This payment has already been refunded", 400);
    if (!payment.stripe_payment_intent_id) throw new ApiError("This payment has no associated Stripe payment intent", 400);

    await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id });
    await pool.execute("UPDATE payments SET status = 'refunded' WHERE id = ?", [req.params.id]);

    const [updatedRows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    await logAudit(req.user.id, "payment.refund", "Payment", payment.id, { amount: payment.amount });

    res.json(mapPayment(updatedRows[0]));
  })
);

module.exports = router;
