import { NextResponse } from "next/server";
import { computeFit, type FitInput } from "@/lib/fit";

/**
 * POST /api/fit-check
 *
 * Body: FitInput { sponsorId, jobTitle, yearsExperience, desiredSalary, location?, industry? }
 * Returns: FitResult
 *
 * Currently uses the local heuristic scorer (src/lib/fit.ts). To switch to
 * OpenAI, set OPENAI_API_KEY and replace the computeFit() call with a chat
 * completion that returns the same FitResult shape (validate with zod).
 *
 * In production this would also: verify the user's session, enforce the
 * per-tier monthly fit-check quota, and persist the result to the FitCheck table.
 */
export async function POST(req: Request) {
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
    const message = err instanceof Error ? err.message : "Fit check failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
