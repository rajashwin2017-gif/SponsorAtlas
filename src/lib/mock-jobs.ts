import { SPONSORS } from "./mock-data";
import { SOC_CODES } from "./soc-data";

export type JobType = "Full-time" | "Part-time" | "Contract" | "Remote";

export interface Job {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorTown: string;
  sponsorIndustry: string;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  jobType: JobType;
  socCode: string;
  description: string;
  skills: string[];
  source: string;
  postedDaysAgo: number;
  isActive: boolean;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const SKILLS_BY_INDUSTRY: Record<string, string[]> = {
  Tech: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "SQL", "GraphQL", "Go"],
  Healthcare: ["Patient care", "NHS experience", "HCPC registered", "Clinical governance", "EMR systems", "CQC compliance"],
  Finance: ["FCA regulated", "Excel", "Bloomberg", "Risk management", "Regulatory reporting", "Python", "SQL"],
  Engineering: ["AutoCAD", "SolidWorks", "MATLAB", "Project management", "ISO standards", "Lean manufacturing"],
  Education: ["QTS", "Curriculum design", "SEND", "Assessment", "Safeguarding", "EYFS"],
  Construction: ["CSCS card", "AutoCAD", "BIM", "Health & Safety", "Contract management", "Site management"],
  Marketing: ["Google Analytics", "Meta Ads", "SEO", "Content strategy", "HubSpot", "Paid social"],
  Legal: ["Legal research", "Contract drafting", "Litigation", "Corporate law", "Due diligence"],
  Science: ["Lab skills", "HPLC", "PCR", "Data analysis", "GLP", "Technical writing"],
  Manufacturing: ["Lean", "Six Sigma", "PLC programming", "Quality control", "ERP systems"],
  Logistics: ["Supply chain", "SAP", "Route optimisation", "Customs clearance", "WMS"],
  Creative: ["Adobe Creative Suite", "Motion graphics", "Brand identity", "UX design", "Figma"],
};

const SOURCES = ["LinkedIn", "Indeed", "Reed", "Totaljobs", "Company site"];

function generateJobs(): Job[] {
  const rng = mulberry32(20260618);
  const jobs: Job[] = [];
  let id = 1;

  const activeSponsors = SPONSORS.filter((s) => s.licenceStatus === "Active" && s.liveJobsCount > 0);

  for (const sponsor of activeSponsors.slice(0, 60)) {
    const count = Math.min(sponsor.liveJobsCount, 4);
    const industry = sponsor.industryCategory;
    const industrySkills = SKILLS_BY_INDUSTRY[industry] ?? SKILLS_BY_INDUSTRY.Tech;
    const matchingSoc = SOC_CODES.filter((s) => s.industryCategory === industry);
    const socPool = matchingSoc.length ? matchingSoc : SOC_CODES;

    for (let i = 0; i < count; i++) {
      const soc = pick(rng, socPool);
      const base = soc.lowerRate2026;
      const salaryMin = Math.round((base * (0.95 + rng() * 0.1)) / 1000) * 1000;
      const salaryMax = Math.round((base * (1.1 + rng() * 0.4)) / 1000) * 1000;
      const skills = Array.from(new Set([...Array(4)].map(() => pick(rng, industrySkills)))).slice(0, 4);
      const types: JobType[] = ["Full-time", "Part-time", "Contract", "Remote"];
      const jobType: JobType = rng() < 0.7 ? "Full-time" : pick(rng, types);

      jobs.push({
        id: `job_${(id++).toString().padStart(4, "0")}`,
        sponsorId: sponsor.id,
        sponsorName: sponsor.organisationName,
        sponsorTown: sponsor.town,
        sponsorIndustry: industry,
        title: soc.occupationTitle,
        location: `${sponsor.town}, ${sponsor.county}`,
        salaryMin,
        salaryMax,
        jobType,
        socCode: soc.socCode,
        description: `${sponsor.organisationName} is seeking a ${soc.occupationTitle} to join their growing team in ${sponsor.town}. This role offers visa sponsorship under the ${sponsor.route} route. Competitive salary of £${(salaryMin / 1000).toFixed(0)}k–£${(salaryMax / 1000).toFixed(0)}k depending on experience.`,
        skills,
        source: pick(rng, SOURCES),
        postedDaysAgo: Math.floor(rng() * 28) + 1,
        isActive: true,
      });
    }
  }
  return jobs;
}

export const JOBS: Job[] = generateJobs();

export interface JobSearchParams {
  q?: string;
  industries?: string[];
  cities?: string[];
  jobTypes?: string[];
  minSalary?: number;
  sort?: "recent" | "salary_high" | "salary_low" | "relevance";
}

export function searchJobs(params: JobSearchParams = {}): Job[] {
  const { q = "", industries = [], cities = [], jobTypes = [], minSalary = 0, sort = "recent" } = params;

  let results = JOBS.filter((j) => {
    if (industries.length && !industries.includes(j.sponsorIndustry)) return false;
    if (cities.length && !cities.includes(j.sponsorTown)) return false;
    if (jobTypes.length && !jobTypes.includes(j.jobType)) return false;
    if (j.salaryMin < minSalary) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return (
        j.title.toLowerCase().includes(n) ||
        j.sponsorName.toLowerCase().includes(n) ||
        j.sponsorTown.toLowerCase().includes(n) ||
        j.sponsorIndustry.toLowerCase().includes(n) ||
        j.socCode.includes(n)
      );
    }
    return true;
  });

  switch (sort) {
    case "salary_high":
      results = results.sort((a, b) => b.salaryMax - a.salaryMax);
      break;
    case "salary_low":
      results = results.sort((a, b) => a.salaryMin - b.salaryMin);
      break;
    case "recent":
      results = results.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
      break;
    default:
      results = results.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  }

  return results;
}
