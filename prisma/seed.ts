import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SPONSORS } from "../src/lib/mock-data";
import { SOC_CODES } from "../src/lib/soc-data";

const prisma = new PrismaClient();
const SEED_PASSWORD_HASH = bcrypt.hashSync("password123", 12);

async function main() {
  console.log("🌱 Seeding SponsorAtlas…");

  // ── SOC codes ──
  await prisma.socCode.deleteMany();
  for (const s of SOC_CODES) {
    await prisma.socCode.create({
      data: {
        socCode: s.socCode,
        occupationTitle: s.occupationTitle,
        skillLevel: s.skillLevel,
        goingRate2026: s.goingRate2026,
        lowerRate2026: s.lowerRate2026,
        isOnIsl: s.isOnIsl,
        isOnTsl: s.isOnTsl,
        description: s.description ?? null,
      },
    });
  }
  console.log(`  ✓ ${SOC_CODES.length} SOC codes`);

  // ── Sponsors ──
  await prisma.sponsor.deleteMany();
  for (const s of SPONSORS) {
    await prisma.sponsor.create({
      data: {
        id: s.id,
        organisationName: s.organisationName,
        normalisedName: s.organisationName.toUpperCase(),
        town: s.town,
        townNormalised: s.town.toLowerCase(),
        county: s.county,
        rating: s.rating,
        ratingType: s.ratingType ?? "Worker",
        licenceStatus: s.licenceStatus,
        addedDate: new Date(s.addedDate),
        industryCategory: s.industryCategory,
        companySize: s.companySize,
        sicCode: s.sicCode,
        companiesHouseNumber: s.companiesHouseNumber,
        sponsorStrengthScore: s.sponsorStrengthScore ?? s.hiringLikelihoodScore,
        opportunityScore: s.opportunityScore ?? s.hiringLikelihoodScore,
        sponsorTier: s.sponsorTier ?? "Active",
        hiringActivity: s.hiringActivity ?? "Low",
        cos2025Sw: s.cos2025Sw ?? null,
        cos2025Gbm: s.cos2025Gbm ?? null,
        cos2025SwSuppressed: s.cos2025SwSuppressed ?? false,
        cos2025GbmSuppressed: s.cos2025GbmSuppressed ?? false,
        cos2025Total: s.cos2025Total ?? null,
        liveJobsCount: s.liveJobsCount,
        lastJobPostedAt: s.lastJobPostedAt ? new Date(s.lastJobPostedAt) : null,
      },
    });
  }
  console.log(`  ✓ ${SPONSORS.length} sponsors`);

  // ── Sample users (free / pro / pro_plus / admin) ──
  // All seeded accounts share the password "password123" for local testing.
  const users = [
    { email: "free@example.com", name: "Free User", subscriptionTier: "free", subscriptionStatus: "inactive", monthlyChecksLimit: 5, password: SEED_PASSWORD_HASH, emailVerified: new Date() },
    { email: "pro@example.com", name: "Pro User", subscriptionTier: "pro", subscriptionStatus: "active", monthlyChecksLimit: 9999, password: SEED_PASSWORD_HASH, emailVerified: new Date() },
    { email: "proplus@example.com", name: "Pro+ User", subscriptionTier: "pro_plus", subscriptionStatus: "active", monthlyChecksLimit: 9999, password: SEED_PASSWORD_HASH, emailVerified: new Date() },
    { email: "admin@example.com", name: "Admin User", role: "ADMIN" as const, subscriptionTier: "pro_plus", subscriptionStatus: "active", monthlyChecksLimit: 9999, password: SEED_PASSWORD_HASH, emailVerified: new Date() },
  ];
  await prisma.user.deleteMany();
  const created = [];
  for (const u of users) {
    created.push(await prisma.user.create({ data: u }));
  }
  console.log(`  ✓ ${users.length} sample users`);

  // ── Sample saved sponsors + fit checks for the Pro user ──
  const proUser = created[1];
  const topSponsors = SPONSORS.slice()
    .sort((a, b) => b.hiringLikelihoodScore - a.hiringLikelihoodScore)
    .slice(0, 4);

  for (const s of topSponsors) {
    await prisma.savedSponsor.create({
      data: { userId: proUser.id, sponsorId: s.id, notes: "Strong hiring signals — follow up." },
    });
  }
  await prisma.fitCheck.create({
    data: {
      userId: proUser.id,
      sponsorId: topSponsors[0].id,
      score: 82,
      suggestedRoles: topSponsors[0].suggestedSocCodes,
      salaryMatch: true,
      gapAnalysis: "Strong alignment across salary, industry and hiring signals.",
    },
  });
  await prisma.opportunityAlert.create({
    data: { userId: proUser.id, industry: "Tech", city: "London", frequency: "weekly", isActive: true },
  });
  console.log(`  ✓ Sample saved sponsors, fit check & alert for ${proUser.email}`);

  // ── Pricing plans (managed from /admin/plans; stripeProductId etc. stay
  // null until an admin saves the plan with STRIPE_SECRET_KEY configured) ──
  const plans = [
    {
      planId: "pro",
      name: "Pro",
      badge: "Most Popular",
      highlighted: true,
      displayOrder: 1,
      monthlyPriceMinor: 1999,
      yearlyPriceMinor: 9999,
      features: [
        "Everything in Free",
        "Active sponsorship vacancies",
        "Direct employer application links",
        "Unlimited searches",
        "Advanced filtering",
        "Save favourite employers & jobs",
        "Email alerts & notifications",
        "Sponsorship insights",
        "Employer activity updates",
      ],
    },
    {
      planId: "pro_plus",
      name: "Pro Plus",
      badge: null,
      highlighted: false,
      displayOrder: 2,
      monthlyPriceMinor: 2999,
      yearlyPriceMinor: 14999,
      features: [
        "Everything in Pro",
        "Premium candidate profile",
        "CV review tools",
        "AI CV matching",
        "Interview preparation resources",
        "Priority job alerts",
        "Employer recommendations",
        "Application tracking tools",
        "Priority customer support",
        "Early access to new features",
      ],
    },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { planId: p.planId }, create: p, update: {} });
  }
  console.log(`  ✓ ${plans.length} pricing plans (draft — sync from /admin/plans once Stripe is configured)`);

  console.log("✅ Seed complete. Sign in with any seeded email above and password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
