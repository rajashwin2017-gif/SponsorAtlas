import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";
import { syncPlanToStripe } from "@/lib/plan-sync";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.plan.findMany({ orderBy: { displayOrder: "asc" } });
    return NextResponse.json(plans);
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  planId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, "Plan ID must be lowercase letters, numbers, - or _"),
  name: z.string().trim().min(1, "Name is required").max(100),
  tagline: z.string().trim().max(200).optional(),
  badge: z.string().trim().max(50).optional(),
  highlighted: z.boolean().default(false),
  monthlyPriceMinor: z.number().int().min(0, "Price can't be negative"),
  yearlyPriceMinor: z.number().int().min(0, "Price can't be negative"),
  features: z.array(z.string().trim().min(1)).default([]),
  displayOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const existing = await prisma.plan.findUnique({ where: { planId: parsed.data.planId } });
    if (existing) throw new ApiError("A plan with this ID already exists", 409);

    const synced = await syncPlanToStripe(null, {
      name: parsed.data.name,
      monthlyPriceMinor: parsed.data.monthlyPriceMinor,
      yearlyPriceMinor: parsed.data.yearlyPriceMinor,
    });

    const plan = await prisma.plan.create({
      data: { ...parsed.data, features: parsed.data.features, ...synced },
    });

    await logAudit(admin.id, "plan.create", "Plan", plan.id, { name: plan.name });

    return NextResponse.json({ ...plan, stripeConfigured: Boolean(stripe) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
