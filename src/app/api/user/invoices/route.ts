import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const sessionUser = await requireUser();
    const invoices = await prisma.invoice.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        hostedInvoiceUrl: true,
        pdfUrl: true,
        createdAt: true,
      },
    });
    return NextResponse.json(invoices);
  } catch (err) {
    return handleApiError(err);
  }
}
