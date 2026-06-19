export type Route = "Skilled Worker" | "Health & Care" | "Scale-up" | "Global Business Mobility";
export type Rating = "A-rated" | "B-rated";
export type LicenceStatus = "Active" | "Suspended" | "Revoked";
export type CompanySize = "Startup" | "SME" | "Enterprise";
export type HiringBand = "High" | "Medium" | "Low";

export interface Sponsor {
  id: string;
  organisationName: string;
  town: string;
  county: string;
  route: Route;
  rating: Rating;
  licenceStatus: LicenceStatus;
  addedDate: string; // ISO
  lastUpdated: string; // ISO
  industryCategory: string;
  companySize: CompanySize;
  sicCode: string;
  companiesHouseNumber: string;
  hiringLikelihoodScore: number; // 0-100
  cosActivity2022: number;
  cosActivity2023: number;
  cosActivity2024: number;
  cosActivity2025: number;
  cosActivity2026: number;
  liveJobsCount: number;
  lastJobPostedAt: string | null;
  suggestedSocCodes: string[];
}

export interface SocCode {
  socCode: string;
  occupationTitle: string;
  skillLevel: string; // "RQF 3", "RQF 6", etc.
  goingRate2026: number;
  lowerRate2026: number;
  isOnIsl: boolean;
  isOnTsl: boolean;
  industryCategory: string;
  description?: string;
}

export type SubscriptionTier = "free" | "pro" | "pro_plus";

export function hiringBand(score: number): HiringBand {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}
