import { PrismaClient } from "@prisma/client";
import { syncPlanToStripe } from "../src/lib/plan-sync";

const prisma = new PrismaClient();

async function run() {
  console.log("Reading plans from database...");
  const plans = await prisma.plan.findMany({ where: { active: true } });
  
  if (plans.length === 0) {
    console.log("No active plans found in the database. Please seed the database first.");
    return;
  }
  
  console.log(`Found ${plans.length} plans: ${plans.map(p => p.planId).join(", ")}`);
  
  for (const p of plans) {
    console.log(`Syncing plan "${p.name}" (${p.planId}) to Stripe...`);
    try {
      const result = await syncPlanToStripe(
        {
          name: p.name,
          monthlyPriceMinor: p.monthlyPriceMinor,
          yearlyPriceMinor: p.yearlyPriceMinor,
          stripeProductId: p.stripeProductId,
          stripeMonthlyPriceId: p.stripeMonthlyPriceId,
          stripeYearlyPriceId: p.stripeYearlyPriceId,
        },
        {
          name: p.name,
          monthlyPriceMinor: p.monthlyPriceMinor,
          yearlyPriceMinor: p.yearlyPriceMinor,
        }
      );
      
      console.log(`Plan "${p.name}" synced:`, result);
      
      await prisma.plan.update({
        where: { id: p.id },
        data: result,
      });
      
      console.log(`Updated plan "${p.name}" in database.`);
    } catch (err: any) {
      console.error(`Failed to sync plan "${p.name}":`, err.message || err);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
