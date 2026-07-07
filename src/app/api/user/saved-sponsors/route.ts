import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.savedSponsor.findMany({
      where: { userId: user.id },
      select: { sponsorId: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows.map((r) => r.sponsorId));
  } catch (err) {
    return handleApiError(err);
  }
}
