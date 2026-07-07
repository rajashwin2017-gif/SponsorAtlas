import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: { sponsorId: string } }) {
  try {
    const user = await requireUser();
    await prisma.savedSponsor.upsert({
      where: { userId_sponsorId: { userId: user.id, sponsorId: params.sponsorId } },
      create: { userId: user.id, sponsorId: params.sponsorId },
      update: {},
    });
    return NextResponse.json({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { sponsorId: string } }) {
  try {
    const user = await requireUser();
    await prisma.savedSponsor.deleteMany({
      where: { userId: user.id, sponsorId: params.sponsorId },
    });
    return NextResponse.json({ saved: false });
  } catch (err) {
    return handleApiError(err);
  }
}
