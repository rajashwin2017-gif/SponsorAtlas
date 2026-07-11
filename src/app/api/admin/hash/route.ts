import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => null);
    const { action, password, hash } = body ?? {};

    if (action === "hash") {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "password is required" }, { status: 400 });
      }
      const result = await hashPassword(password);
      return NextResponse.json({ hash: result });
    }

    if (action === "verify") {
      if (!password || !hash || typeof password !== "string" || typeof hash !== "string") {
        return NextResponse.json({ error: "password and hash are required" }, { status: 400 });
      }
      const match = await verifyPassword(password, hash);
      return NextResponse.json({ match });
    }

    return NextResponse.json({ error: "action must be 'hash' or 'verify'" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
