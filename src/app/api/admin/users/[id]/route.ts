import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").optional(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (params.id === admin.id && (parsed.data.role === "MEMBER" || parsed.data.status === "suspended")) {
      throw new ApiError("You cannot demote or suspend your own account", 400);
    }

    const before = await prisma.user.findUniqueOrThrow({ where: { id: params.id } });

    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (parsed.data.role && parsed.data.role !== before.role) {
      await logAudit(admin.id, parsed.data.role === "ADMIN" ? "user.promote" : "user.demote", "User", user.id);
    }
    if (parsed.data.status && parsed.data.status !== before.status) {
      await logAudit(admin.id, parsed.data.status === "suspended" ? "user.suspend" : "user.unsuspend", "User", user.id);
    }
    if (parsed.data.name && parsed.data.name !== before.name) {
      await logAudit(admin.id, "user.update", "User", user.id, { name: parsed.data.name });
    }

    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    if (params.id === admin.id) {
      throw new ApiError("You cannot delete your own account", 400);
    }

    await prisma.user.delete({ where: { id: params.id } });
    await logAudit(admin.id, "user.delete", "User", params.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
