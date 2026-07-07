import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// Otherwise Next.js statically optimizes this route at build time (no
// cookies/headers used) and the pricing page would keep serving whatever
// plans existed at the last build, ignoring admin edits.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      select: {
        planId: true,
        name: true,
        tagline: true,
        badge: true,
        highlighted: true,
        monthlyPriceMinor: true,
        yearlyPriceMinor: true,
        features: true,
      },
    });
    return NextResponse.json(plans);
  } catch (err) {
    return handleApiError(err);
  }
}
