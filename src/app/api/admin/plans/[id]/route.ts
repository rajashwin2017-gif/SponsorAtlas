import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";
import { syncPlanToStripe, archivePlanInStripe } from "@/lib/plan-sync";
import { stripe } from "@/lib/stripe";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  tagline: z.string().trim().max(200).optional(),
  badge: z.string().trim().max(50).optional(),
  highlighted: z.boolean().optional(),
  monthlyPriceMinor: z.number().int().min(0, "Price can't be negative").optional(),
  yearlyPriceMinor: z.number().int().min(0, "Price can't be negative").optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  displayOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const existing = await prisma.plan.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Plan not found", 404);

    const synced = await syncPlanToStripe(
      {
        name: existing.name,
        monthlyPriceMinor: existing.monthlyPriceMinor,
        yearlyPriceMinor: existing.yearlyPriceMinor,
        stripeProductId: existing.stripeProductId,
        stripeMonthlyPriceId: existing.stripeMonthlyPriceId,
        stripeYearlyPriceId: existing.stripeYearlyPriceId,
      },
      {
        name: parsed.data.name ?? existing.name,
        monthlyPriceMinor: parsed.data.monthlyPriceMinor ?? existing.monthlyPriceMinor,
        yearlyPriceMinor: parsed.data.yearlyPriceMinor ?? existing.yearlyPriceMinor,
      }
    );

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: { ...parsed.data, ...synced },
    });

    await logAudit(admin.id, "plan.update", "Plan", plan.id, { name: plan.name });

    return NextResponse.json({ ...plan, stripeConfigured: Boolean(stripe) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const existing = await prisma.plan.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Plan not found", 404);

    await archivePlanInStripe(existing);
    await prisma.plan.update({ where: { id: params.id }, data: { active: false } });
    await logAudit(admin.id, "plan.archive", "Plan", existing.id, { name: existing.name });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
