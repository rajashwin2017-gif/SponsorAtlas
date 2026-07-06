import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        alertFrequency: true,
        monthlyChecksUsed: true,
        monthlyChecksLimit: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
  alertFrequency: z.enum(["daily", "weekly", "none"]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, alertFrequency: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}
