import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { getSponsorById } from "@/lib/sponsor-store";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const rows = await prisma.savedSponsor.findMany({
      where: { userId: user.id },
      select: { sponsorId: true },
      orderBy: { createdAt: "desc" },
    });
    const ids = rows.map((r) => r.sponsorId);

    const { searchParams } = new URL(req.url);
    if (searchParams.get("full") === "1") {
      const sponsors = ids.map((id) => getSponsorById(id)).filter(Boolean);
      return NextResponse.json(sponsors);
    }

    return NextResponse.json(ids);
  } catch (err) {
    return handleApiError(err);
  }
}
