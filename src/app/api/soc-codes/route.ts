import { NextResponse } from "next/server";
import { SOC_CODES } from "@/lib/soc-data";

/**
 * GET /api/soc-codes?q=<query>
 * Fuzzy lookup over SOC code + occupation title. Returns matching occupations
 * with their 2026 going/lower rates and ISL/TSL status.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();

  const data = !q
    ? SOC_CODES
    : SOC_CODES.filter(
        (s) =>
          s.socCode.includes(q) ||
          s.occupationTitle.toLowerCase().includes(q) ||
          s.industryCategory.toLowerCase().includes(q)
      );

  return NextResponse.json({ data, total: data.length });
}
