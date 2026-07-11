import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: NextRequest) {
  const limited = rateLimit(`resend-verification:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Return success even when the user doesn't exist to avoid account enumeration.
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  // Delete any existing token for this address and issue a fresh one.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TTL_MS),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, verifyUrl, user.name ?? undefined);

  return NextResponse.json({ ok: true });
}
