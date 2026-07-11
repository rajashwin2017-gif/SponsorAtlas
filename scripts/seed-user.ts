/**
 * One-off script to upsert a user record into the database.
 * Run on the VPS with:
 *   npx tsx scripts/seed-user.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "proplus@example.com" },
    update: {
      name: "Pro+ User",
      password: "$2b$12$Uw1s1eQkWRSAJ1N5NGdVj.LDX/GBcmHO/Lo2mtZBwA6W8LpTYtUv2",
      role: "MEMBER",
      status: "active",
      emailVerified: new Date("2026-07-09T20:03:56.307Z"),
      subscriptionTier: "pro_plus",
      subscriptionStatus: "active",
      monthlyChecksUsed: 0,
      monthlyChecksLimit: 9999,
      alertFrequency: "weekly",
    },
    create: {
      id: "e1c2836e-8911-4997-94dc-b12c8cbe933f",
      email: "proplus@example.com",
      name: "Pro+ User",
      password: "$2b$12$Uw1s1eQkWRSAJ1N5NGdVj.LDX/GBcmHO/Lo2mtZBwA6W8LpTYtUv2",
      role: "MEMBER",
      status: "active",
      emailVerified: new Date("2026-07-09T20:03:56.307Z"),
      subscriptionTier: "pro_plus",
      subscriptionStatus: "active",
      monthlyChecksUsed: 0,
      monthlyChecksLimit: 9999,
      alertFrequency: "weekly",
    },
  });

  console.log("✓ User upserted:", user.id, user.email, user.subscriptionTier);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
