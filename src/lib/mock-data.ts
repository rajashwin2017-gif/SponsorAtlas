import type { CompanySize, Rating, Route, Sponsor, LicenceStatus } from "./types";
import { SOC_CODES } from "./soc-data";

// ── Deterministic PRNG (mulberry32) so server & client render identically ──
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INDUSTRIES = [
  "Tech", "Healthcare", "Finance", "Engineering", "Education", "Construction",
  "Manufacturing", "Marketing", "Legal", "Science", "Hospitality", "Retail",
  "Logistics", "Creative", "Sales",
];

const CITIES: Array<[string, string]> = [
  ["London", "Greater London"], ["Manchester", "Greater Manchester"],
  ["Birmingham", "West Midlands"], ["Leeds", "West Yorkshire"],
  ["Edinburgh", "Midlothian"], ["Glasgow", "Lanarkshire"],
  ["Bristol", "Bristol"], ["Cambridge", "Cambridgeshire"],
  ["Reading", "Berkshire"], ["Oxford", "Oxfordshire"],
  ["Liverpool", "Merseyside"], ["Newcastle upon Tyne", "Tyne and Wear"],
  ["Sheffield", "South Yorkshire"], ["Nottingham", "Nottinghamshire"],
  ["Cardiff", "South Glamorgan"], ["Belfast", "County Antrim"],
  ["Brighton", "East Sussex"], ["Coventry", "West Midlands"],
  ["Milton Keynes", "Buckinghamshire"], ["Aberdeen", "Aberdeenshire"],
];

const ROUTES: Route[] = ["Skilled Worker", "Health & Care", "Scale-up", "Global Business Mobility"];
const SIZES: CompanySize[] = ["Startup", "SME", "Enterprise"];

const SUFFIXES = ["Ltd", "Group", "Holdings", "Technologies", "Partners", "Systems", "Labs", "Solutions", "UK", "International", "PLC", "Consulting"];
const PREFIXES_BY_INDUSTRY: Record<string, string[]> = {
  Tech: ["Nimbus", "Quantel", "Bytewave", "Codeflow", "Hexapod", "Vantix", "Lumenix", "Datapeak", "Synthize", "Orbital"],
  Healthcare: ["CarePoint", "Medora", "Vitalis", "Healix", "Caradon", "Novacare", "Pristine Health", "Meridian Care", "Brightwell", "Anchor Care"],
  Finance: ["Sterling", "Atlas Capital", "Northbridge", "Cobalt Finance", "Aether", "Pinnacle", "Greythorn", "Sovereign", "Lattice", "Keystone"],
  Engineering: ["Forge", "Axiom", "Magnum", "Tensor", "Brunel", "Ironclad", "Vector", "Spectra", "Helix", "Caterham"],
  Education: ["Scholar", "Academia", "Brightpath", "Knowledge Tree", "Cambridge Learning", "EduNova", "Lyceum", "Mentora", "Cognita", "Aspire"],
  Construction: ["Cornerstone", "Bedrock", "Buildwell", "Granite", "Summit Build", "Northgate", "Heritage", "Mason & Co", "Brickfield", "Citadel"],
  Manufacturing: ["Precision", "Ferro", "Apex Manufacturing", "Albion", "Crucible", "Sterling Works", "Northforge", "Pioneer", "Vantage", "Tritium"],
  Marketing: ["Beacon", "Amplify", "Spark Media", "Vivid", "Resonate", "Brightside", "Catalyst", "Loud & Clear", "Northstar", "Echo"],
  Legal: ["Halloway", "Whitfield", "Carter & Hale", "Lexworth", "Ashcroft", "Bramley", "Pennington", "Castlebar", "Fenwick", "Marlow"],
  Science: ["Genomix", "BioVantage", "Cellix", "Quantum Bio", "Helicon", "Proteus", "Nucleus", "Catalysis", "Verdant", "Aurora Bio"],
  Hospitality: ["The Wessex", "Grandview", "Heritage Hotels", "Mayfield", "Coast & Co", "Belvedere", "Crown Estate", "Harbourside", "Oakwood", "Riverbank"],
  Retail: ["Marketgate", "Highstreet Co", "Verve Retail", "Trendline", "Emporia", "Brightbuy", "Northgate Retail", "Pinnacle Stores", "Cartwheel", "Daily Goods"],
  Logistics: ["Cargowing", "Freightline", "Velocity", "Northhaul", "Transcend", "Swiftmove", "Cargo Atlas", "Linehaul", "Portway", "Expediant"],
  Creative: ["Studio Nine", "Inkwell", "Pixel & Co", "Canvas", "Foundry", "Bold Type", "Northlight", "Render", "Maker House", "Palette"],
  Sales: ["Velocity Sales", "Pipeline", "Northreach", "Convert", "Apex Sales", "Closeline", "Frontier", "Outbound Co", "Revline", "Trailhead"],
};

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildName(rng: () => number, industry: string, idx: number): string {
  const prefixes = PREFIXES_BY_INDUSTRY[industry] ?? PREFIXES_BY_INDUSTRY.Tech;
  const base = prefixes[idx % prefixes.length];
  const suffix = pick(rng, SUFFIXES);
  return `${base} ${suffix}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date("2026-06-17T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function generateSponsors(count: number): Sponsor[] {
  const rng = mulberry32(20260617);
  const sponsors: Sponsor[] = [];
  const perIndustryCount: Record<string, number> = {};

  for (let i = 0; i < count; i++) {
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    perIndustryCount[industry] = (perIndustryCount[industry] ?? 0) + 1;
    const [town, county] = pick(rng, CITIES);
    const size = pick(rng, SIZES);

    // Route weighted toward Skilled Worker; Health & Care biased to Healthcare.
    let route: Route;
    if (industry === "Healthcare" && rng() < 0.55) route = "Health & Care";
    else if (rng() < 0.08) route = pick(rng, ["Scale-up", "Global Business Mobility"]);
    else route = "Skilled Worker";

    const rating: Rating = rng() < 0.88 ? "A-rated" : "B-rated";
    const licenceRoll = rng();
    const licenceStatus: LicenceStatus =
      licenceRoll < 0.94 ? "Active" : licenceRoll < 0.98 ? "Suspended" : "Revoked";

    // CoS activity trend — generally rising into 2025/26 with noise.
    const base = Math.floor(rng() * 60) + (size === "Enterprise" ? 80 : size === "SME" ? 20 : 2);
    const cos2022 = Math.max(0, Math.floor(base * (0.5 + rng() * 0.3)));
    const cos2023 = Math.max(0, Math.floor(cos2022 * (0.9 + rng() * 0.5)));
    const cos2024 = Math.max(0, Math.floor(cos2023 * (0.9 + rng() * 0.6)));
    const cos2025 = Math.max(0, Math.floor(cos2024 * (0.9 + rng() * 0.7)));
    const cos2026 = Math.max(0, Math.floor(cos2025 * (0.4 + rng() * 0.6))); // partial year

    const liveJobsCount =
      licenceStatus === "Active" ? Math.floor(rng() * (size === "Enterprise" ? 40 : 14)) : 0;

    // Hiring likelihood: blend of recent CoS momentum, live jobs, rating, status.
    const momentum = cos2025 + cos2026 * 1.5;
    let score = Math.min(
      100,
      Math.round(momentum * 0.7 + liveJobsCount * 1.8 + (rating === "A-rated" ? 12 : 0))
    );
    if (licenceStatus !== "Active") score = Math.floor(score * 0.2);
    score = Math.max(2, score);

    const lastJobDays = liveJobsCount > 0 ? Math.floor(rng() * 30) : null;

    // Suggested SOC codes matched to industry.
    const matching = SOC_CODES.filter((s) => s.industryCategory === industry);
    const pool = matching.length ? matching : SOC_CODES;
    const suggested = Array.from(new Set([0, 1, 2].map(() => pick(rng, pool).socCode))).slice(0, 3);

    sponsors.push({
      id: `spn_${(i + 1).toString().padStart(4, "0")}`,
      organisationName: buildName(rng, industry, perIndustryCount[industry] - 1),
      town,
      county,
      route,
      rating,
      licenceStatus,
      addedDate: isoDaysAgo(Math.floor(rng() * 1400) + 30),
      lastUpdated: isoDaysAgo(Math.floor(rng() * 40)),
      industryCategory: industry,
      companySize: size,
      sicCode: `${Math.floor(rng() * 90000) + 10000}`,
      companiesHouseNumber: `${Math.floor(rng() * 9000000) + 1000000}`,
      hiringLikelihoodScore: score,
      cosActivity2022: cos2022,
      cosActivity2023: cos2023,
      cosActivity2024: cos2024,
      cosActivity2025: cos2025,
      cosActivity2026: cos2026,
      liveJobsCount,
      lastJobPostedAt: lastJobDays === null ? null : isoDaysAgo(lastJobDays),
      suggestedSocCodes: suggested,
    });
  }
  return sponsors;
}

export const SPONSORS: Sponsor[] = generateSponsors(126);
export const INDUSTRY_LIST = INDUSTRIES;
export const ROUTE_LIST = ROUTES;
export const CITY_LIST = CITIES.map(([town]) => town);

export function getSponsorById(id: string): Sponsor | undefined {
  return SPONSORS.find((s) => s.id === id);
}

export function getSimilarSponsors(sponsor: Sponsor, limit = 3): Sponsor[] {
  return SPONSORS.filter(
    (s) => s.id !== sponsor.id && s.industryCategory === sponsor.industryCategory
  )
    .sort((a, b) => b.hiringLikelihoodScore - a.hiringLikelihoodScore)
    .slice(0, limit);
}

// ── Search / filter / sort ──────────────────────────────────────────────
export type SortKey = "relevance" | "recent" | "hiring" | "cos";

export interface SearchParams {
  q?: string;
  industries?: string[];
  cities?: string[];
  routes?: string[];
  aRatedOnly?: boolean;
  minCos?: number;
  hiringBands?: string[]; // "High" | "Medium" | "Low"
  sort?: SortKey;
}

function fuzzyScore(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return 0;
  if (h.includes(n)) return 100 - h.indexOf(n);
  // crude trigram-ish overlap
  let hits = 0;
  for (let i = 0; i < n.length - 1; i++) {
    if (h.includes(n.slice(i, i + 2))) hits++;
  }
  return hits > 0 ? hits : -1;
}

export function searchSponsors(params: SearchParams): Sponsor[] {
  const {
    q = "", industries = [], cities = [], routes = [],
    aRatedOnly = false, minCos = 0, hiringBands = [], sort = "relevance",
  } = params;

  let results = SPONSORS.filter((s) => {
    if (aRatedOnly && s.rating !== "A-rated") return false;
    if (industries.length && !industries.includes(s.industryCategory)) return false;
    if (cities.length && !cities.includes(s.town)) return false;
    if (routes.length && !routes.includes(s.route)) return false;
    if (s.cosActivity2025 < minCos) return false;
    if (hiringBands.length) {
      const band = s.hiringLikelihoodScore >= 70 ? "High" : s.hiringLikelihoodScore >= 40 ? "Medium" : "Low";
      if (!hiringBands.includes(band)) return false;
    }
    if (q.trim()) {
      const score = Math.max(
        fuzzyScore(s.organisationName, q),
        fuzzyScore(s.town, q),
        fuzzyScore(s.industryCategory, q)
      );
      if (score < 0) return false;
    }
    return true;
  });

  switch (sort) {
    case "recent":
      results = results.sort((a, b) => +new Date(b.addedDate) - +new Date(a.addedDate));
      break;
    case "hiring":
      results = results.sort((a, b) => b.hiringLikelihoodScore - a.hiringLikelihoodScore);
      break;
    case "cos":
      results = results.sort((a, b) => b.cosActivity2025 - a.cosActivity2025);
      break;
    default:
      if (q.trim()) {
        results = results.sort(
          (a, b) =>
            Math.max(fuzzyScore(b.organisationName, q), fuzzyScore(b.town, q)) -
            Math.max(fuzzyScore(a.organisationName, q), fuzzyScore(a.town, q))
        );
      } else {
        results = results.sort((a, b) => b.hiringLikelihoodScore - a.hiringLikelihoodScore);
      }
  }
  return results;
}

export function suggestSponsorNames(q: string, limit = 6): Sponsor[] {
  if (!q.trim()) return [];
  return searchSponsors({ q, sort: "relevance" }).slice(0, limit);
}
