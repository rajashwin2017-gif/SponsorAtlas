import { PrismaClient } from "@prisma/client";
import { SPONSORS } from "../src/lib/mock-data";
import { SOC_CODES } from "../src/lib/soc-data";

const prisma = new PrismaClient();

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
        town: s.town,
        county: s.county,
        route: s.route,
        rating: s.rating,
        licenceStatus: s.licenceStatus,
        addedDate: new Date(s.addedDate),
        industryCategory: s.industryCategory,
        companySize: s.companySize,
        sicCode: s.sicCode,
        companiesHouseNumber: s.companiesHouseNumber,
        hiringLikelihoodScore: s.hiringLikelihoodScore,
        cosActivity2024: s.cosActivity2024,
        cosActivity2025: s.cosActivity2025,
        cosActivity2026: s.cosActivity2026,
        liveJobsCount: s.liveJobsCount,
        lastJobPostedAt: s.lastJobPostedAt ? new Date(s.lastJobPostedAt) : null,
      },
    });
  }
  console.log(`  ✓ ${SPONSORS.length} sponsors`);

  // ── Sample users (free / pro / pro_plus) ──
  const users = [
    { email: "free@example.com", name: "Free User", subscriptionTier: "free", subscriptionStatus: "inactive", monthlyChecksLimit: 5 },
    { email: "pro@example.com", name: "Pro User", subscriptionTier: "pro", subscriptionStatus: "active", monthlyChecksLimit: 9999 },
    { email: "proplus@example.com", name: "Pro+ User", subscriptionTier: "pro_plus", subscriptionStatus: "active", monthlyChecksLimit: 9999 },
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

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
