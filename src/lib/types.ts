export type Rating = "A" | "B" | "Provisional";
export type LicenceStatus = "Active" | "Suspended" | "Revoked";
export type CompanySize = "Startup" | "SME" | "Enterprise";
export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Bronze" | "Active" | "Inactive";
export type HiringActivity = "Very High" | "High" | "Medium" | "Low" | "Inactive";

/** Legacy band — kept for existing components */
export type HiringBand = "High" | "Medium" | "Low";

export interface Sponsor {
  id: string;
  organisationName: string;
  town: string;
  county: string;

  /** Primary route (first in the list — kept for legacy UI compat) */
  route: string;
  /** All visa routes this sponsor holds */
  routes: string[];

  rating: Rating;
  ratingType: string;
  licenceStatus: LicenceStatus;
  addedDate: string;
  lastUpdated: string;

  industryCategory: string;
  companySize: CompanySize;
  sicCode: string;
  companiesHouseNumber: string;

  // Intelligence scores
  sponsorStrengthScore: number;   // 0–100
  opportunityScore: number;       // 0–100
  sponsorTier: SponsorTier;
  hiringActivity: HiringActivity;

  // 2025 CoS from FOI
  cos2025Total: number | null;
  cos2025Sw: number | null;
  cos2025Gbm: number | null;
  cos2025SwSuppressed: boolean;
  cos2025GbmSuppressed: boolean;

  // Legacy / live signals
  hiringLikelihoodScore: number;  // alias for sponsorStrengthScore
  cosActivity2025: number;        // alias for cos2025Sw ?? 0
  liveJobsCount: number;
  lastJobPostedAt: string | null;
  suggestedSocCodes: string[];
}

export interface SocCode {
  socCode: string;
  occupationTitle: string;
  skillLevel: string;
  goingRate2026: number;
  lowerRate2026: number;
  isOnIsl: boolean;
  isOnTsl: boolean;
  industryCategory: string;
  /** Going rate set by a national pay scale (NHS/STRB) — varies by band/region, so no single figure applies. */
  nationalPayScale?: boolean;
  description?: string;
}

export type SubscriptionTier = "free" | "pro" | "pro_plus";

/** Map HiringActivity → legacy HiringBand for existing components */
export function hiringBand(scoreOrActivity: number | string): HiringBand {
  if (typeof scoreOrActivity === "string") {
    if (scoreOrActivity === "Very High" || scoreOrActivity === "High") return "High";
    if (scoreOrActivity === "Medium") return "Medium";
    return "Low";
  }
  if (scoreOrActivity >= 70) return "High";
  if (scoreOrActivity >= 40) return "Medium";
  return "Low";
}

export const TIER_COLORS: Record<SponsorTier, string> = {
  Platinum: "text-violet-600",
  Gold: "text-amber-600",
  Silver: "text-slate-500",
  Bronze: "text-emerald-700",
  Active: "text-blue-600",
  Inactive: "text-zinc-400",
};

export const TIER_BG: Record<SponsorTier, string> = {
  Platinum: "bg-violet-50 text-violet-700 border-violet-200",
  Gold: "bg-amber-50 text-amber-700 border-amber-200",
  Silver: "bg-slate-50 text-slate-600 border-slate-200",
  Bronze: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Active: "bg-blue-50 text-blue-700 border-blue-200",
  Inactive: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

export const ACTIVITY_COLORS: Record<HiringActivity, string> = {
  "Very High": "text-emerald-600",
  "High": "text-emerald-500",
  "Medium": "text-amber-600",
  "Low": "text-zinc-400",
  "Inactive": "text-zinc-300",
};

export const ACTIVITY_DOT: Record<HiringActivity, string> = {
  "Very High": "bg-emerald-500",
  "High": "bg-emerald-400",
  "Medium": "bg-amber-500",
  "Low": "bg-zinc-400",
  "Inactive": "bg-zinc-300",
};
