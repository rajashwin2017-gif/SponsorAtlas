# SponsorAtlas API server

A standalone Express/Node.js backend for SponsorAtlas: authentication, user
profile/billing, admin dashboard, and Stripe subscriptions. Plain JavaScript,
plain SQL (MySQL) — no ORM, no build step, no framework beyond Express.

- **`schema.sql`** — the raw `CREATE TABLE` statements. This *is* the source of truth for the database structure (open it and read it — no generated client hiding what's there).
- **`src/db/pool.js`** — a `mysql2` connection pool. Every route queries it directly with parameterized SQL (`pool.execute("SELECT * FROM users WHERE id = ?", [id])`).
- **`scripts/runMigration.js`** — applies `schema.sql` to your database.
- **`scripts/seed.js`** — inserts demo users.

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` — at minimum set `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`
(your MySQL database) and `JWT_SECRET` (generate with `openssl rand -base64 32`).

```bash
npm run migrate   # applies schema.sql — creates all tables
npm run seed       # creates demo users (password: password123)
```

## Run

```bash
npm start        # production: node src/server.js
npm run dev       # development: auto-restarts on file changes
```

Server listens on `http://localhost:4000` by default (`PORT` in `.env`).

## API overview

All routes are prefixed `/api`. Auth uses an httpOnly `token` cookie set on
login — send requests `credentials: "include"` (browser) or `-c/-b cookies.txt`
(curl) to stay logged in across requests.

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | — | Create an account |
| `/api/auth/login` | POST | — | Log in, sets the session cookie |
| `/api/auth/logout` | POST | — | Clears the session cookie |
| `/api/auth/session` | GET | user | Current logged-in user |
| `/api/auth/verify-email` | GET | — | Verify email from the emailed link |
| `/api/auth/forgot-password` | POST | — | Request a reset link |
| `/api/auth/reset-password` | POST | — | Reset password with a token |
| `/api/user/profile` | GET/PATCH | user | View/update your profile |
| `/api/user/subscription` | GET | user | Your current plan/status |
| `/api/user/subscription/cancel` | POST | user | Cancel at period end |
| `/api/user/subscription/reactivate` | POST | user | Undo a pending cancellation |
| `/api/user/invoices` | GET | user | Billing history |
| `/api/admin/stats` | GET | admin | Dashboard metrics (MRR/ARR/etc.) |
| `/api/admin/users` | GET | admin | List/search/filter users |
| `/api/admin/users/:id` | PATCH/DELETE | admin | Edit/suspend/promote/delete a user |
| `/api/admin/subscriptions` | GET | admin | All subscriptions |
| `/api/admin/payments` | GET | admin | All payments |
| `/api/admin/payments/:id/refund` | POST | admin | Refund a payment via Stripe |
| `/api/stripe/checkout` | POST | user | Start a Stripe Checkout session |
| `/api/stripe/portal` | POST | user | Open the Stripe customer portal |
| `/api/stripe/webhook` | POST | — (Stripe signs it) | Stripe event sync |

## Quick manual test

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -b cookies.txt http://localhost:4000/api/user/profile
```
