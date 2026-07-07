/**
 * Inserts demo users for local testing (all use password: password123).
 * Usage (from server/): npm run seed
 */
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { pool } = require("../src/db/pool");

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const users = [
    { email: "free@example.com", name: "Free User", role: "MEMBER", tier: "free", status: "inactive" },
    { email: "pro@example.com", name: "Pro User", role: "MEMBER", tier: "pro", status: "active" },
    { email: "proplus@example.com", name: "Pro+ User", role: "MEMBER", tier: "pro_plus", status: "active" },
    { email: "admin@example.com", name: "Admin User", role: "ADMIN", tier: "pro_plus", status: "active" },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, email, name, password, role, subscription_tier, subscription_status, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE email = email`,
      [uuidv4(), u.email, u.name, passwordHash, u.role, u.tier, u.status]
    );
    console.log(`  - ${u.email}`);
  }

  console.log("Seed complete. Sign in with any email above and password: password123");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
