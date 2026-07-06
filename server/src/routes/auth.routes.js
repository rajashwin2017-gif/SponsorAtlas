const crypto = require("crypto");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { hashPassword, verifyPassword } = require("../lib/password");
const { signToken } = require("../lib/jwt");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../lib/email");
const { rateLimit, getClientIp } = require("../lib/rateLimit");
const { mapUser } = require("../lib/mappers");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ── Register ──────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const limited = rateLimit(`register:${getClientIp(req)}`, 10, 15 * 60 * 1000);
    if (!limited.success) throw new ApiError("Too many requests. Try again later.", 429);

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const { rows: existingRows } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingRows.length > 0) throw new ApiError("An account with this email already exists", 409);

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, email, name, passwordHash]
      );

      const token = crypto.randomBytes(32).toString("hex");
      await client.query(
        "INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, $3)",
        [email, token, new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)]
      );
      await client.query("COMMIT");

      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:4000"}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, verifyUrl);

      res.status(201).json(mapUser(rows[0]));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// ── Login ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const limited = rateLimit(`login:${getClientIp(req)}`, 20, 15 * 60 * 1000);
    if (!limited.success) throw new ApiError("Too many requests. Try again later.", 429);

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const email = parsed.data.email.toLowerCase();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user || !user.password) throw new ApiError("Invalid email or password", 401);
    if (user.status === "suspended") throw new ApiError("This account has been suspended", 403);

    const valid = await verifyPassword(parsed.data.password, user.password);
    if (!valid) throw new ApiError("Invalid email or password", 401);

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);
    res.json(mapUser(user));
  })
);

// ── Logout ────────────────────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true });
});

// ── Current session ──────────────────────────────────────────────────────
router.get("/session", requireUser, (req, res) => {
  res.json(mapUser(req.user));
});

// ── Verify email ─────────────────────────────────────────────────────────
router.get(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ error: "Invalid verification link" });

    const identifier = String(email).toLowerCase();
    const { rows } = await pool.query(
      "SELECT * FROM verification_tokens WHERE identifier = $1 AND token = $2",
      [identifier, String(token)]
    );
    const record = rows[0];

    if (!record || record.expires < new Date()) {
      if (record) {
        await pool.query("DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2", [identifier, String(token)]);
      }
      return res.status(400).json({ error: "This verification link is invalid or has expired." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET email_verified = now() WHERE email = $1", [identifier]);
      await client.query("DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2", [identifier, String(token)]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: "Email verified. You can now sign in." });
  })
);

// ── Forgot password ──────────────────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().trim().email() });

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const limited = rateLimit(`forgot-password:${getClientIp(req)}`, 5, 15 * 60 * 1000);
    if (!limited.success) throw new ApiError("Too many requests. Try again later.", 429);

    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError("Enter a valid email address", 400);

    const email = parsed.data.email.toLowerCase();
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    // Always respond the same way so this endpoint can't be used to
    // enumerate registered emails.
    if (user && user.password) {
      const token = crypto.randomBytes(32).toString("hex");
      await pool.query(
        "INSERT INTO password_reset_tokens (id, user_id, token, expires) VALUES ($1, $2, $3, $4)",
        [uuidv4(), user.id, token, new Date(Date.now() + RESET_TOKEN_TTL_MS)]
      );
      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:4000"}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  })
);

// ── Reset password ───────────────────────────────────────────────────────
const resetSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { token, password } = parsed.data;
    const { rows } = await pool.query("SELECT * FROM password_reset_tokens WHERE token = $1", [token]);
    const record = rows[0];

    if (!record || record.expires < new Date()) {
      if (record) await pool.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
      throw new ApiError("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET password = $1 WHERE id = $2", [passwordHash, record.user_id]);
      await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [record.user_id]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: "Password updated. You can now sign in." });
  })
);

module.exports = router;
