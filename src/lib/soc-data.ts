import type { SocCode } from "./types";

/**
 * UK Skilled Worker occupation codes with OFFICIAL salary data.
 *
 * Sources (UK Home Office / gov.uk, Open Government Licence v3.0):
 *  • Standard & lower "going rates" — Immigration Rules Appendix Skilled Worker,
 *    "going rates for eligible occupation codes". Last updated 22 July 2025.
 *    https://www.gov.uk/government/publications/skilled-worker-visa-going-rates-for-eligible-occupations/skilled-worker-visa-going-rates-for-eligible-occupation-codes
 *  • Immigration Salary List (isOnIsl) — last updated 11 November 2025.
 *    https://www.gov.uk/government/publications/skilled-worker-visa-immigration-salary-list/skilled-worker-visa-immigration-salary-list
 *  • Healthcare & education roles (nationalPayScale: true) have going rates set
 *    by national pay scales (NHS / STRB), which vary by pay band and UK region —
 *    so no single figure applies. For those rows the numeric fields hold the
 *    general Skilled Worker salary floor (£25,000) only as a conservative
 *    minimum; the UI shows "national pay scale" instead of a fixed number.
 *    https://www.gov.uk/government/publications/skilled-worker-visa-eligible-healthcare-and-education-jobs/skilled-worker-visa-eligible-healthcare-and-education-jobs
 *
 * Going-rate annual figures assume a 37.5-hour week. This is a representative
 * subset of eligible occupations, not the full list. Always verify the current
 * figure for a specific role on gov.uk — rules and rates change.
 */

export const SOC_DATA_SOURCES = {
  goingRatesUrl:
    "https://www.gov.uk/government/publications/skilled-worker-visa-going-rates-for-eligible-occupations/skilled-worker-visa-going-rates-for-eligible-occupation-codes",
  goingRatesUpdated: "22 July 2025",
  islUrl:
    "https://www.gov.uk/government/publications/skilled-worker-visa-immigration-salary-list/skilled-worker-visa-immigration-salary-list",
  islUpdated: "11 November 2025",
  healthEduUrl:
    "https://www.gov.uk/skilled-worker-visa/if-you-work-in-healthcare-or-education",
} as const;

// General Skilled Worker salary floor used as a placeholder minimum for
// national-pay-scale (NHS/STRB) roles where no single going rate applies.
const PAY_SCALE_FLOOR = 25000;

export const SOC_CODES: SocCode[] = [
  // ── Managers & directors ──────────────────────────────────────────────────
  { socCode: "1131", occupationTitle: "Financial managers and directors", skillLevel: "RQF 6", goingRate2026: 75100, lowerRate2026: 49700, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "1132", occupationTitle: "Marketing, sales and advertising directors", skillLevel: "RQF 6", goingRate2026: 87300, lowerRate2026: 60000, isOnIsl: false, isOnTsl: false, industryCategory: "Marketing" },
  { socCode: "1136", occupationTitle: "Human resource managers and directors", skillLevel: "RQF 6", goingRate2026: 52900, lowerRate2026: 41200, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "1121", occupationTitle: "Production managers and directors in manufacturing", skillLevel: "RQF 6", goingRate2026: 55000, lowerRate2026: 40000, isOnIsl: false, isOnTsl: false, industryCategory: "Manufacturing" },
  { socCode: "1122", occupationTitle: "Production managers and directors in construction", skillLevel: "RQF 6", goingRate2026: 53400, lowerRate2026: 41400, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },

  // ── Information technology ────────────────────────────────────────────────
  { socCode: "2134", occupationTitle: "Programmers and software development professionals", skillLevel: "RQF 6", goingRate2026: 54700, lowerRate2026: 40000, isOnIsl: false, isOnTsl: false, industryCategory: "Tech", description: "Design, build, test and maintain software systems and applications." },
  { socCode: "2133", occupationTitle: "IT business analysts, architects and systems designers", skillLevel: "RQF 6", goingRate2026: 54900, lowerRate2026: 42400, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },
  { socCode: "2135", occupationTitle: "Cyber security professionals", skillLevel: "RQF 6", goingRate2026: 48500, lowerRate2026: 35300, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },
  { socCode: "2136", occupationTitle: "IT quality and testing professionals", skillLevel: "RQF 6", goingRate2026: 41200, lowerRate2026: 34500, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },
  { socCode: "2137", occupationTitle: "IT network professionals", skillLevel: "RQF 6", goingRate2026: 45600, lowerRate2026: 38100, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },
  { socCode: "2139", occupationTitle: "Information technology professionals n.e.c.", skillLevel: "RQF 6", goingRate2026: 52300, lowerRate2026: 38700, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },
  { socCode: "2141", occupationTitle: "Web design professionals", skillLevel: "RQF 6", goingRate2026: 43800, lowerRate2026: 31300, isOnIsl: false, isOnTsl: false, industryCategory: "Tech" },

  // ── Science & research ────────────────────────────────────────────────────
  { socCode: "2161", occupationTitle: "Research and development (R&D) managers", skillLevel: "RQF 6", goingRate2026: 54400, lowerRate2026: 40000, isOnIsl: false, isOnTsl: false, industryCategory: "Science" },
  { socCode: "2162", occupationTitle: "Other researchers, unspecified discipline", skillLevel: "RQF 6", goingRate2026: 43600, lowerRate2026: 37400, isOnIsl: false, isOnTsl: false, industryCategory: "Science" },
  { socCode: "2111", occupationTitle: "Chemical scientists", skillLevel: "RQF 6", goingRate2026: 39900, lowerRate2026: 31300, isOnIsl: true, isOnTsl: false, industryCategory: "Science" },
  { socCode: "2112", occupationTitle: "Biological scientists", skillLevel: "RQF 6", goingRate2026: 40300, lowerRate2026: 30700, isOnIsl: true, isOnTsl: false, industryCategory: "Science" },
  { socCode: "2113", occupationTitle: "Biochemists and biomedical scientists", skillLevel: "RQF 6", goingRate2026: 45900, lowerRate2026: 35100, isOnIsl: false, isOnTsl: false, industryCategory: "Science" },
  { socCode: "2114", occupationTitle: "Physical scientists", skillLevel: "RQF 6", goingRate2026: 54600, lowerRate2026: 41500, isOnIsl: false, isOnTsl: false, industryCategory: "Science" },

  // ── Finance & legal ───────────────────────────────────────────────────────
  { socCode: "2433", occupationTitle: "Actuaries, economists and statisticians", skillLevel: "RQF 6", goingRate2026: 55100, lowerRate2026: 40700, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "2421", occupationTitle: "Chartered and certified accountants", skillLevel: "RQF 6", goingRate2026: 49200, lowerRate2026: 36900, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "2423", occupationTitle: "Taxation experts", skillLevel: "RQF 6", goingRate2026: 48500, lowerRate2026: 35400, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "3534", occupationTitle: "Financial accounts managers", skillLevel: "RQF 4", goingRate2026: 44700, lowerRate2026: 34800, isOnIsl: false, isOnTsl: false, industryCategory: "Finance" },
  { socCode: "2412", occupationTitle: "Solicitors and lawyers", skillLevel: "RQF 6", goingRate2026: 51600, lowerRate2026: 39000, isOnIsl: false, isOnTsl: false, industryCategory: "Legal" },

  // ── Engineering ───────────────────────────────────────────────────────────
  { socCode: "2122", occupationTitle: "Mechanical engineers", skillLevel: "RQF 6", goingRate2026: 46800, lowerRate2026: 38400, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2123", occupationTitle: "Electrical engineers", skillLevel: "RQF 6", goingRate2026: 58700, lowerRate2026: 47100, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2124", occupationTitle: "Electronics engineers", skillLevel: "RQF 6", goingRate2026: 52000, lowerRate2026: 41200, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2126", occupationTitle: "Aerospace engineers", skillLevel: "RQF 6", goingRate2026: 52400, lowerRate2026: 43400, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2127", occupationTitle: "Engineering project managers and project engineers", skillLevel: "RQF 6", goingRate2026: 51900, lowerRate2026: 40600, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2121", occupationTitle: "Civil engineers", skillLevel: "RQF 6", goingRate2026: 50400, lowerRate2026: 39200, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },
  { socCode: "2129", occupationTitle: "Engineering professionals n.e.c.", skillLevel: "RQF 6", goingRate2026: 46100, lowerRate2026: 37500, isOnIsl: false, isOnTsl: false, industryCategory: "Engineering" },

  // ── Construction & skilled trades ─────────────────────────────────────────
  { socCode: "2451", occupationTitle: "Architects", skillLevel: "RQF 6", goingRate2026: 47600, lowerRate2026: 37800, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "2452", occupationTitle: "Chartered architectural technologists, planning officers and consultants", skillLevel: "RQF 6", goingRate2026: 35800, lowerRate2026: 28200, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "2453", occupationTitle: "Quantity surveyors", skillLevel: "RQF 6", goingRate2026: 48600, lowerRate2026: 38500, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "2455", occupationTitle: "Construction project managers and related professionals", skillLevel: "RQF 6", goingRate2026: 44300, lowerRate2026: 36600, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5315", occupationTitle: "Plumbers and heating and ventilating installers and repairers", skillLevel: "RQF 3", goingRate2026: 38100, lowerRate2026: 31400, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5316", occupationTitle: "Carpenters and joiners", skillLevel: "RQF 3", goingRate2026: 33400, lowerRate2026: 27800, isOnIsl: true, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5312", occupationTitle: "Stonemasons and related trades", skillLevel: "RQF 3", goingRate2026: 33400, lowerRate2026: 28500, isOnIsl: true, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5314", occupationTitle: "Roofers, roof tilers and slaters", skillLevel: "RQF 3", goingRate2026: 33400, lowerRate2026: 25300, isOnIsl: true, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5249", occupationTitle: "Electrical and electronic trades n.e.c.", skillLevel: "RQF 3", goingRate2026: 45800, lowerRate2026: 35600, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },
  { socCode: "5225", occupationTitle: "Air-conditioning and refrigeration installers and repairers", skillLevel: "RQF 3", goingRate2026: 41100, lowerRate2026: 35500, isOnIsl: false, isOnTsl: false, industryCategory: "Construction" },

  // ── Manufacturing ─────────────────────────────────────────────────────────
  { socCode: "5223", occupationTitle: "Metal working production and maintenance fitters", skillLevel: "RQF 3", goingRate2026: 39300, lowerRate2026: 29900, isOnIsl: false, isOnTsl: false, industryCategory: "Manufacturing" },

  // ── Creative & arts ───────────────────────────────────────────────────────
  { socCode: "2142", occupationTitle: "Graphic and multimedia designers", skillLevel: "RQF 4", goingRate2026: 33400, lowerRate2026: 26200, isOnIsl: true, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3421", occupationTitle: "Interior designers", skillLevel: "RQF 4", goingRate2026: 35200, lowerRate2026: 29600, isOnIsl: false, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3422", occupationTitle: "Clothing, fashion and accessories designers", skillLevel: "RQF 4", goingRate2026: 36500, lowerRate2026: 29100, isOnIsl: false, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3411", occupationTitle: "Artists", skillLevel: "RQF 4", goingRate2026: 38200, lowerRate2026: 26600, isOnIsl: true, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3414", occupationTitle: "Dancers and choreographers", skillLevel: "RQF 4", goingRate2026: 33400, lowerRate2026: 28500, isOnIsl: true, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3415", occupationTitle: "Musicians", skillLevel: "RQF 4", goingRate2026: 37500, lowerRate2026: 30100, isOnIsl: true, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "3416", occupationTitle: "Arts officers, producers and directors", skillLevel: "RQF 6", goingRate2026: 38100, lowerRate2026: 28800, isOnIsl: true, isOnTsl: false, industryCategory: "Creative" },
  { socCode: "2472", occupationTitle: "Archivists, conservators and curators", skillLevel: "RQF 6", goingRate2026: 33400, lowerRate2026: 29600, isOnIsl: false, isOnTsl: false, industryCategory: "Creative" },

  // ── Transport & logistics ─────────────────────────────────────────────────
  { socCode: "3511", occupationTitle: "Aircraft pilots and air traffic controllers", skillLevel: "RQF 6", goingRate2026: 80400, lowerRate2026: 64100, isOnIsl: false, isOnTsl: false, industryCategory: "Logistics" },
  { socCode: "3512", occupationTitle: "Ship and hovercraft officers", skillLevel: "RQF 6", goingRate2026: 58300, lowerRate2026: 39100, isOnIsl: false, isOnTsl: false, industryCategory: "Logistics" },

  // ── Healthcare — national pay scale (NHS) ─────────────────────────────────
  { socCode: "2211", occupationTitle: "Generalist medical practitioners", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2212", occupationTitle: "Specialist medical practitioners", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2231", occupationTitle: "Midwifery nurses", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2233", occupationTitle: "Registered specialist nurses", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true, description: "Registered nurses delivering clinical care across NHS and private settings." },
  { socCode: "2234", occupationTitle: "Registered nurse practitioners", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2235", occupationTitle: "Registered mental health nurses", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2221", occupationTitle: "Physiotherapists", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2225", occupationTitle: "Clinical psychologists", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },
  { socCode: "2461", occupationTitle: "Social workers", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Healthcare", nationalPayScale: true },

  // ── Adult social care — Immigration Salary List ───────────────────────────
  { socCode: "6135", occupationTitle: "Care workers and home carers", skillLevel: "RQF 3", goingRate2026: 25000, lowerRate2026: 25000, isOnIsl: true, isOnTsl: false, industryCategory: "Healthcare", description: "Adult social care role; minimum £12.82/hour (~£25,000). Eligible under the Health & Care visa." },
  { socCode: "6136", occupationTitle: "Senior care workers", skillLevel: "RQF 3", goingRate2026: 25000, lowerRate2026: 25000, isOnIsl: true, isOnTsl: false, industryCategory: "Healthcare" },
  { socCode: "6131", occupationTitle: "Nursing auxiliaries and assistants", skillLevel: "RQF 3", goingRate2026: 25000, lowerRate2026: 25000, isOnIsl: true, isOnTsl: false, industryCategory: "Healthcare" },

  // ── Education — national pay scale (STRB / national pay scales) ────────────
  { socCode: "2313", occupationTitle: "Secondary education teaching professionals", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Education", nationalPayScale: true },
  { socCode: "2314", occupationTitle: "Primary education teaching professionals", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Education", nationalPayScale: true },
  { socCode: "2312", occupationTitle: "Further education teaching professionals", skillLevel: "RQF 6", goingRate2026: PAY_SCALE_FLOOR, lowerRate2026: PAY_SCALE_FLOOR, isOnIsl: false, isOnTsl: false, industryCategory: "Education", nationalPayScale: true },
];
