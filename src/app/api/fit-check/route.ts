import { NextRequest, NextResponse } from "next/server";
import { computeFit, type FitInput } from "@/lib/fit";
import { requireUser } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Require sign-in — prevents anonymous abuse and enables quota enforcement.
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in to run a fit check." }, { status: 401 });
  }

  // Per-user rate limit: 30 fit checks per hour.
  const limited = rateLimit(`fit-check:${user.id}`, 30, 60 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many fit checks. Please wait before trying again." },
      { status: 429 }
    );
  }

  // Secondary IP-level limit to protect against credential stuffing / shared accounts.
  const ipLimit = rateLimit(`fit-check-ip:${getClientIp(req)}`, 60, 60 * 60 * 1000);
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: "Too many requests from your network. Try again later." },
      { status: 429 }
    );
  }

  let body: Partial<FitInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sponsorId || !body.jobTitle || !body.desiredSalary) {
    return NextResponse.json(
      { error: "sponsorId, jobTitle and desiredSalary are required" },
      { status: 422 }
    );
  }

  try {
    const result = computeFit({
      sponsorId: body.sponsorId,
      jobTitle: body.jobTitle,
      yearsExperience: Number(body.yearsExperience) || 0,
      desiredSalary: Number(body.desiredSalary) || 0,
      location: body.location,
      industry: body.industry,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(
      err instanceof Error && err.message.includes("not found")
        ? new ApiError(err.message, 404)
        : err
    );
  }
}
