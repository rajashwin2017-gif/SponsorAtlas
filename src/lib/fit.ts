import type { Sponsor } from "./types";
import { SOC_CODES } from "./soc-data";
import { getSponsorById, getSimilarSponsors } from "./mock-data";

export interface FitInput {
  sponsorId: string;
  jobTitle: string;
  yearsExperience: number;
  desiredSalary: number;
  location?: string;
  industry?: string;
}

export interface FitResult {
  score: number; // 0-100
  salaryMatch: boolean;
  matchedSoc: { socCode: string; occupationTitle: string; goingRate2026: number } | null;
  suggestedRoles: { socCode: string; occupationTitle: string; goingRate2026: number }[];
  gapAnalysis: string;
  breakdown: { label: string; value: number; max: number }[];
  alternatives: { id: string; name: string; town: string; score: number }[];
}

function bestSocMatch(jobTitle: string, industry?: string) {
  const q = jobTitle.toLowerCase().trim();
  let best: (typeof SOC_CODES)[number] | null = null;
  let bestScore = -1;
  for (const soc of SOC_CODES) {
    const title = soc.occupationTitle.toLowerCase();
    let score = 0;
    for (const word of q.split(/\s+/).filter((w) => w.length > 2)) {
      if (title.includes(word)) score += 5;
    }
    if (industry && soc.industryCategory.toLowerCase() === industry.toLowerCase()) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = soc;
    }
  }
  return bestScore > 0 ? best : industry ? SOC_CODES.find((s) => s.industryCategory.toLowerCase() === industry.toLowerCase()) ?? null : null;
}

/**
 * Local heuristic Sponsorship Fit scorer. Production swaps the body of this
 * function for an OpenAI call (see api/fit-check/route.ts) — the contract
 * (FitInput -> FitResult) stays identical.
 */
export function computeFit(input: FitInput): FitResult {
  const sponsor = getSponsorById(input.sponsorId);
  if (!sponsor) {
    throw new Error(`Sponsor ${input.sponsorId} not found`);
  }

  const matched = bestSocMatch(input.jobTitle, input.industry ?? sponsor.industryCategory);
  const goingRate = matched?.goingRate2026 ?? 38700;
  const salaryMatch = input.desiredSalary >= goingRate;

  // ── Component scores ──
  // 1. Sponsor hiring momentum (0-35)
  const hiring = Math.round((sponsor.hiringLikelihoodScore / 100) * 35);
  // 2. Salary vs going rate (0-25)
  const salaryRatio = goingRate ? Math.min(1.2, input.desiredSalary / goingRate) : 1;
  const salary = Math.round(Math.min(25, (salaryRatio / 1.0) * 20));
  // 3. Industry alignment (0-15)
  const industryAligned =
    (input.industry ?? "").toLowerCase() === sponsor.industryCategory.toLowerCase() ||
    matched?.industryCategory === sponsor.industryCategory;
  const industry = industryAligned ? 15 : 6;
  // 4. Experience (0-15)
  const experience = Math.round(Math.min(15, (input.yearsExperience / 8) * 15));
  // 5. Location preference (0-10)
  const locationMatch =
    !input.location || input.location.toLowerCase() === sponsor.town.toLowerCase();
  const location = locationMatch ? 10 : 4;

  let score = hiring + salary + industry + experience + location;
  if (sponsor.licenceStatus !== "Active") score = Math.floor(score * 0.3);
  score = Math.max(3, Math.min(100, score));

  const breakdown = [
    { label: "Hiring momentum", value: hiring, max: 35 },
    { label: "Salary vs going rate", value: salary, max: 25 },
    { label: "Industry alignment", value: industry, max: 15 },
    { label: "Experience", value: experience, max: 15 },
    { label: "Location fit", value: location, max: 10 },
  ];

  const suggestedRoles = sponsor.suggestedSocCodes
    .map((code) => SOC_CODES.find((s) => s.socCode === code))
    .filter(Boolean)
    .map((s) => ({ socCode: s!.socCode, occupationTitle: s!.occupationTitle, goingRate2026: s!.goingRate2026 }));

  // Gap analysis prose
  const gaps: string[] = [];
  if (!salaryMatch)
    gaps.push(
      `Your target salary is below the ${goingRate.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })} going rate for this occupation. Aim higher or target a lower-RQF role.`
    );
  if (!industryAligned)
    gaps.push(`This sponsor mostly hires in ${sponsor.industryCategory}; your profile leans elsewhere.`);
  if (sponsor.hiringLikelihoodScore < 40)
    gaps.push("Recent sponsorship activity here is light. Consider higher-momentum employers.");
  if (sponsor.licenceStatus !== "Active")
    gaps.push(`This licence is currently ${sponsor.licenceStatus.toLowerCase()}, so they cannot issue new CoS.`);
  if (input.yearsExperience < 2)
    gaps.push("More demonstrable experience would strengthen a Skilled Worker application.");

  const gapAnalysis =
    gaps.length === 0
      ? "Strong alignment across salary, industry and hiring signals. This is a high-quality target, so save it and set an alert for new roles."
      : gaps.join(" ");

  // Alternatives if score is low
  const alternatives =
    score < 60
      ? getSimilarSponsors(sponsor, 3).map((s) => ({
          id: s.id,
          name: s.organisationName,
          town: s.town,
          score: s.hiringLikelihoodScore,
        }))
      : [];

  return {
    score,
    salaryMatch,
    matchedSoc: matched
      ? { socCode: matched.socCode, occupationTitle: matched.occupationTitle, goingRate2026: matched.goingRate2026 }
      : null,
    suggestedRoles,
    gapAnalysis,
    breakdown,
    alternatives,
  };
}
