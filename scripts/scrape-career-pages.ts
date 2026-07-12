/**
 * scripts/scrape-career-pages.ts
 *
 * Offline scraper — run with:  npx tsx scripts/scrape-career-pages.ts
 *
 * Iterates the ~7 000 URL-type career entries in careers-data.ts, fetches
 * jobs from each, and writes prisma/data/scraped-jobs.json.
 *
 * ATS platforms detected by URL pattern (each has a free public JSON API):
 *   • Ashby          jobs.ashbyhq.com/{slug}
 *   • SmartRecruiters careers.smartrecruiters.com/{slug}
 *   • Recruitee      {slug}.recruitee.com  /  careers.{slug}.recruitee.com
 *   • BambooHR       {slug}.bamboohr.com/careers
 *   • Teamtailor     careers.{slug}.com  (teamtailor meta tag)
 *   • Personio       {slug}.jobs.personio.de  /  {slug}.jobs.personio.com
 *   • Pinpoint       {slug}.pinpointhq.com
 *   • Jobvite        careers.jobvite.com/{slug}
 *
 * For all others we fetch the raw HTML and extract <a> links that look like
 * job postings (href/text pattern matching).
 *
 * Results are tagged with sponsorIndustry from the 126K register so the
 * /jobs board can show at least 3 live jobs per industry.
 */

import fs from "fs";
import path from "path";
import { getUrlEntries, normaliseCompanyName } from "../src/lib/careers-data";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedJob {
  id: string;
  companyKey: string;
  sponsorId: string;
  sponsorName: string;
  sponsorIndustry: string;
  sponsorTown: string;
  title: string;
  location: string;
  department?: string;
  applyUrl: string;
  source: string;
  scrapedAt: string;
}

interface ScrapedJobsFile {
  scrapedAt: string;
  totalJobs: number;
  jobs: ScrapedJob[];
}

// ── Sponsor index ─────────────────────────────────────────────────────────────

interface SponsorRow {
  id: string;
  organisationName: string;
  industryCategory: string;
  town: string;
}

function loadSponsors(): Map<string, SponsorRow> {
  const dataFile = path.join(process.cwd(), "prisma", "data", "sponsors-slim.json");
  const raw: SponsorRow[] = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const map = new Map<string, SponsorRow>();
  for (const s of raw) {
    const key = normaliseCompanyName(s.organisationName);
    if (!map.has(key)) map.set(key, s);
  }
  return map;
}

function resolveSponsor(
  key: string,
  idx: Map<string, SponsorRow>
): SponsorRow | undefined {
  const exact = idx.get(key);
  if (exact) return exact;
  // partial match (key contained in sponsor key)
  for (const [k, v] of Array.from(idx)) {
    if (k.startsWith(key) || k.includes(key)) return v;
  }
  return undefined;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const TIMEOUT_MS = 12_000;
const UA = "Mozilla/5.0 (compatible; SponsorAtlasScraper/1.0; +https://sponsoratlas.co.uk)";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── ATS scrapers ──────────────────────────────────────────────────────────────

// Job keyword filter — exclude internal/support roles from appearing on the
// board (optional; comment out to include everything).
const EXCLUDE_TITLE = /intern(?:ship)?|apprenti|work experience|volunteer|test role|demo/i;

function cleanTitle(t: string): string {
  return t.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

// ── Ashby ──────────────────────────────────────────────────────────────────────
// URL pattern: jobs.ashbyhq.com/{slug} or careers.{domain}/
// Ashby embeds a JSON board at: https://api.ashbyhq.com/posting-api/job-board/{slug}
async function scrapeAshby(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ jobPostings?: Array<Record<string, unknown>> }>(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`
  );
  if (!data?.jobPostings) return [];
  return data.jobPostings
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      title: cleanTitle(String(j.title ?? "")),
      location: String((j.location as { name?: string } | undefined)?.name ?? j.locationName ?? ""),
      department: j.department ? String((j.department as { name?: string }).name ?? j.department) : undefined,
      url: String(j.jobUrl ?? j.applyUrl ?? `https://jobs.ashbyhq.com/${slug}`),
    }))
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── SmartRecruiters ───────────────────────────────────────────────────────────
// URL pattern: careers.smartrecruiters.com/{slug}
async function scrapeSmartRecruiters(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ content?: Array<Record<string, unknown>> }>(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?status=PUBLIC&offset=0&limit=50`
  );
  if (!Array.isArray(data?.content)) return [];
  return (data.content as Record<string, unknown>[])
    .map((j) => {
      const loc = j.location as { country?: string; city?: string } | undefined;
      return {
        title: cleanTitle(String(j.name ?? j.title ?? "")),
        location: [loc?.city, loc?.country].filter(Boolean).join(", "),
        department: j.department ? String((j.department as { label?: string }).label ?? j.department) : undefined,
        url: String(j.ref ?? `https://careers.smartrecruiters.com/${slug}`),
      };
    })
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── Recruitee ─────────────────────────────────────────────────────────────────
// URL pattern: {slug}.recruitee.com or careers.{company}.com (Recruitee-hosted)
async function scrapeRecruitee(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ offers?: Array<Record<string, unknown>> }>(
    `https://${slug}.recruitee.com/api/offers/`
  );
  if (!Array.isArray(data?.offers)) return [];
  return (data.offers as Record<string, unknown>[])
    .map((j) => ({
      title: cleanTitle(String(j.title ?? "")),
      location: String(j.city ?? j.location ?? ""),
      department: j.department ? String(j.department) : undefined,
      url: String(j.url ?? j.careers_url ?? `https://${slug}.recruitee.com/`),
    }))
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── BambooHR ──────────────────────────────────────────────────────────────────
// URL pattern: {slug}.bamboohr.com/careers
async function scrapeBambooHR(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ result?: Array<Record<string, unknown>> }>(
    `https://${slug}.bamboohr.com/careers/list`
  );
  if (!Array.isArray(data?.result)) return [];
  return (data.result as Record<string, unknown>[])
    .map((j) => ({
      title: cleanTitle(String(j.jobOpeningName ?? j.title ?? "")),
      location: String(j.location ?? j.city ?? ""),
      department: j.department ? String(j.department) : undefined,
      url: String(j.id
        ? `https://${slug}.bamboohr.com/careers/${j.id}`
        : `https://${slug}.bamboohr.com/careers/`),
    }))
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── Personio ──────────────────────────────────────────────────────────────────
// URL pattern: {slug}.jobs.personio.de or {slug}.jobs.personio.com
async function scrapePersonio(slug: string, tld = "de"): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
    `https://${slug}.jobs.personio.${tld}/xml`
  );
  if (!Array.isArray(data?.data)) return [];
  return (data.data as Record<string, unknown>[])
    .map((j) => {
      const attrs = j.jobPosition as Record<string, unknown> | undefined ?? j;
      return {
        title: cleanTitle(String(attrs.name ?? attrs.title ?? "")),
        location: String(attrs.office ?? attrs.location ?? ""),
        department: attrs.department ? String(attrs.department) : undefined,
        url: String(attrs.id
          ? `https://${slug}.jobs.personio.${tld}/${attrs.id}`
          : `https://${slug}.jobs.personio.${tld}/`),
      };
    })
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── Pinpoint ──────────────────────────────────────────────────────────────────
// URL pattern: {slug}.pinpointhq.com
async function scrapePinpoint(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ data?: Array<Record<string, unknown>> }>(
    `https://${slug}.pinpointhq.com/api/v1/jobs`
  );
  if (!Array.isArray(data?.data)) return [];
  return (data.data as Record<string, unknown>[]).map((j) => {
    const attrs = (j.attributes ?? j) as Record<string, unknown>;
    return {
      title: cleanTitle(String(attrs.title ?? attrs.name ?? "")),
      location: String(attrs.location ?? attrs.city ?? ""),
      department: attrs.department_name ? String(attrs.department_name) : undefined,
      url: String(attrs.job_ad_url ?? attrs.url ?? `https://${slug}.pinpointhq.com/`),
    };
  }).filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── Teamtailor ────────────────────────────────────────────────────────────────
// URL pattern: app.teamtailor.com or custom domain with Teamtailor embed.
// The public JSON feed is at: {careers_url}?format=json (Teamtailor serves it)
async function scrapeTeamtailor(careersUrl: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  // Try the JSON feed
  const feedUrl = careersUrl.replace(/\/$/, "") + "?format=json";
  const data = await fetchJson<{ jobs?: Array<Record<string, unknown>> }>(feedUrl);
  if (data?.jobs && Array.isArray(data.jobs)) {
    return data.jobs
      .map((j) => ({
        title: cleanTitle(String(j.title ?? j.name ?? "")),
        location: String((j.locations as Array<{ name?: string }>)?.[0]?.name ?? j.location ?? ""),
        department: j.department ? String((j.department as { name?: string }).name ?? j.department) : undefined,
        url: String(j.apply_url ?? j.url ?? careersUrl),
      }))
      .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
  }
  // Fall through to HTML scrape
  return scrapeHtml(careersUrl);
}

// ── Jobvite ───────────────────────────────────────────────────────────────────
// URL pattern: careers.jobvite.com/{slug}/jobs
async function scrapeJobvite(slug: string): Promise<Array<{ title: string; location: string; department?: string; url: string }>> {
  const data = await fetchJson<{ requisitions?: Array<Record<string, unknown>> }>(
    `https://api.jobvite.com/api/v2/job?sc=${slug}&clientId=${slug}&api=jobs`
  );
  if (!Array.isArray(data?.requisitions)) return [];
  return (data.requisitions as Record<string, unknown>[])
    .map((j) => ({
      title: cleanTitle(String(j.title ?? "")),
      location: String(j.location ?? j.city ?? ""),
      department: j.category ? String(j.category) : undefined,
      url: String(j.applyLink ?? j.jobDetailLink ?? `https://careers.jobvite.com/${slug}/jobs`),
    }))
    .filter((j) => j.title && !EXCLUDE_TITLE.test(j.title));
}

// ── HTML scraper (generic fallback) ───────────────────────────────────────────
// Looks for <a> elements whose href or text strongly suggests a job posting.

// Href must contain a job-page path segment
const JOB_HREF = /\/(job|jobs|vacancy|vacancies|positions?|openings?|apply|current-opportunities|join-us|work-with-us|recruitment|hiring)\b/i;
const NOT_JOB_HREF = /\.(css|js|png|jpg|jpeg|gif|svg|pdf|zip|woff|ico)(\?|$)/i;
// Text must look like an actual job title — requires a specific role word
// (deliberately excludes generic words like "care", "support" alone which appear in nav)
const JOB_TITLE_WORDS = /\b(engineer|developer|manager|director|officer|analyst|coordinator|consultant|nurse|doctor|care worker|care assistant|support worker|advisor|specialist|designer|architect|lead|head of|senior |junior |graduate |trainee |chef|driver|teacher|lecturer|administrator|recruiter|accountant|technician|scientist|researcher|exec|associate|partner|counsel|solicitor|barrister|therapist|physiotherapist|pharmacist|surgeon|registrar|paramedic|midwife|social worker|occupational therapist|counsellor|psychologist|radiographer|dentist|optometrist|veterinar|mechanic|electrician|plumber|builder|carpenter|security officer|security guard|porter|cleaner|housekeeper|barista|waiter|waitress|kitchen assistant|sales|marketing executive|finance|legal|compliance officer|software|data scientist|data engineer|devops|product manager|project manager|programme manager|operations manager|customer service)\b/i;

// Extract absolute URL from an href relative to a base URL
function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

async function scrapeHtml(pageUrl: string): Promise<Array<{ title: string; location: string; url: string }>> {
  const html = await fetchHtml(pageUrl);
  if (!html) return [];

  const results: Array<{ title: string; location: string; url: string }> = [];
  const seen = new Set<string>();

  // Match all <a ...>text</a> blocks
  const linkRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(html)) !== null) {
    const attrs = m[1];
    const inner = m[2];

    // Extract href
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript") || href.startsWith("mailto")) continue;
    if (NOT_JOB_HREF.test(href)) continue;

    // Extract visible text
    const text = inner.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
    if (!text || text.length < 5 || text.length > 120) continue;

    const absUrl = absoluteUrl(href, pageUrl);

    // Must look like a job posting: href has a job-path segment AND text has a job title word.
    // Requiring both prevents navigation links (e.g. /our-care) from slipping through.
    const looksLikeJob = JOB_HREF.test(href) && JOB_TITLE_WORDS.test(text);
    if (!looksLikeJob) continue;

    // De-duplicate by URL
    if (seen.has(absUrl)) continue;
    seen.add(absUrl);

    results.push({ title: cleanTitle(text), location: "", url: absUrl });

    if (results.length >= 30) break; // cap per-page
  }

  return results.filter((j) => !EXCLUDE_TITLE.test(j.title));
}

// ── URL → scraper router ──────────────────────────────────────────────────────

interface JobSnippet {
  title: string;
  location: string;
  department?: string;
  url: string;
}

async function scrapeUrl(rawUrl: string): Promise<JobSnippet[]> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return [];
  }
  const host = u.hostname.replace(/^www\./, "");
  const pathname = u.pathname;

  // Ashby
  if (host === "jobs.ashbyhq.com") {
    const slug = pathname.split("/").filter(Boolean)[0];
    if (slug) return scrapeAshby(slug);
  }

  // SmartRecruiters
  if (host === "careers.smartrecruiters.com" || host === "jobs.smartrecruiters.com") {
    const slug = pathname.split("/").filter(Boolean)[0];
    if (slug) return scrapeSmartRecruiters(slug);
  }

  // Recruitee  ─  {slug}.recruitee.com
  if (host.endsWith(".recruitee.com")) {
    const slug = host.replace(".recruitee.com", "");
    return scrapeRecruitee(slug);
  }

  // BambooHR  ─  {slug}.bamboohr.com
  if (host.endsWith(".bamboohr.com")) {
    const slug = host.replace(".bamboohr.com", "");
    return scrapeBambooHR(slug);
  }

  // Personio  ─  {slug}.jobs.personio.de / .com
  if (host.endsWith(".jobs.personio.de")) {
    const slug = host.replace(".jobs.personio.de", "");
    return scrapePersonio(slug, "de");
  }
  if (host.endsWith(".jobs.personio.com")) {
    const slug = host.replace(".jobs.personio.com", "");
    return scrapePersonio(slug, "com");
  }

  // Pinpoint  ─  {slug}.pinpointhq.com
  if (host.endsWith(".pinpointhq.com")) {
    const slug = host.replace(".pinpointhq.com", "");
    return scrapePinpoint(slug);
  }

  // Jobvite
  if (host === "careers.jobvite.com") {
    const slug = pathname.split("/").filter(Boolean)[0];
    if (slug) return scrapeJobvite(slug);
  }

  // Teamtailor  ─  app.teamtailor.com/{slug}/jobs  OR  custom domain
  if (host === "app.teamtailor.com") {
    return scrapeTeamtailor(rawUrl);
  }

  // HTML scrape for everything else
  return scrapeHtml(rawUrl);
}

// ── UK location heuristic ─────────────────────────────────────────────────────

const UK_LOC = /(united kingdom|\bu\.?k\.?\b|\bg\.?b\.?\b|\bengland\b|scotland|wales|northern ireland|london|manchester|edinburgh|glasgow|birmingham|leeds|bristol|cambridge|oxford|reading|sheffield|liverpool|nottingham|cardiff|belfast|remote|hybrid)/i;
const NON_UK_LOC = /\b(san francisco|new york|singapore|paris|milan|berlin|amsterdam|dubai|toronto|sydney|melbourne|chicago|los angeles|boston|seattle|austin|denver|atlanta|madrid|barcelona|munich|zurich|stockholm|oslo|copenhagen|helsinki|warsaw|prague|budapest|johannesburg|nairobi|bangalore|mumbai|delhi|shanghai|beijing|tokyo|seoul|hong kong|taipei|manila|jakarta|kuala lumpur|maryland|california|texas|florida|illinois|ontario|new south wales|americas|apac|emea)\b/i;
const BAD_TITLE = /^job title:|more details$|&#x?[0-9a-f]+;|click here|apply now|view job|read more/i;
const HTML_ENTITY = /&[a-z]+;|&#x?[0-9a-f]+;/gi;

function isUkOrUnknown(loc: string): boolean {
  if (!loc) return true; // assume UK for unknown (all are UK sponsors)
  if (NON_UK_LOC.test(loc)) return false;
  return true; // don't require explicit UK mention — UK sponsors default to UK
}

function isBadTitle(title: string): boolean {
  if (!title || title.length < 4 || title.length > 120) return true;
  if (BAD_TITLE.test(title)) return true;
  if (HTML_ENTITY.test(title)) return true;
  return false;
}

function decodeTitle(t: string): string {
  return t
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&#8212;/g, "—")
    .replace(/&#x2022;/g, "•").replace(/\s+/g, " ").trim();
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

async function runPool<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  let done = 0;
  const total = tasks.length;

  async function worker() {
    while (idx < total) {
      const i = idx++;
      results[i] = await tasks[i]();
      done++;
      if (onProgress && done % 50 === 0) onProgress(done, total);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const OUT_PATH = path.join(process.cwd(), "prisma", "data", "scraped-jobs.json");

// Collected results — written on success AND on unexpected crash.
const collectedJobs: ScrapedJob[] = [];

function saveResults(label: string) {
  const byIndustry: Record<string, number> = {};
  for (const j of collectedJobs) {
    byIndustry[j.sponsorIndustry] = (byIndustry[j.sponsorIndustry] || 0) + 1;
  }
  console.log(`\n${label} — ${collectedJobs.length} jobs across ${Object.keys(byIndustry).length} industries`);
  console.log("\nJobs per industry:");
  for (const [ind, count] of Object.entries(byIndustry).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ind.padEnd(30)} ${count}`);
  }
  const out: ScrapedJobsFile = {
    scrapedAt: new Date().toISOString(),
    totalJobs: collectedJobs.length,
    jobs: collectedJobs,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Wrote ${collectedJobs.length} jobs → ${OUT_PATH}`);
}

// Save partial results on unexpected crash so work isn't lost.
process.on("uncaughtException", (err) => {
  console.error("\nUncaught exception:", err.message);
  saveResults("Partial results saved");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("\nUnhandled rejection:", reason);
  saveResults("Partial results saved");
  process.exit(1);
});

async function main() {
  console.log("Loading sponsor index…");
  const sponsorIdx = loadSponsors();
  console.log(`  ${sponsorIdx.size} sponsors indexed`);

  // Load any existing scraped jobs so a re-run merges rather than restarts.
  const existingKeys = new Set<string>();
  if (fs.existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as ScrapedJobsFile;
      for (const j of existing.jobs) {
        collectedJobs.push(j);
        existingKeys.add(j.companyKey);
      }
      console.log(`  Resuming: ${collectedJobs.length} jobs already collected from previous run`);
    } catch { /* ignore corrupt file */ }
  }

  const urlEntries = getUrlEntries();
  console.log(`  ${urlEntries.length} URL-type career pages to scrape`);

  const tasks = urlEntries
    .filter(({ key }) => !existingKeys.has(key)) // skip already-scraped
    .map(({ key, url }) => async (): Promise<ScrapedJob[]> => {
    const sponsor = resolveSponsor(key, sponsorIdx);
    if (!sponsor) return [];

    let snippets: JobSnippet[] = [];
    try {
      snippets = await scrapeUrl(url);
    } catch {
      return [];
    }

    const now = new Date().toISOString();
    return snippets
      .filter((s) => isUkOrUnknown(s.location) && !isBadTitle(decodeTitle(s.title)))
      .slice(0, 20)
      .map((s, i): ScrapedJob => ({
        id: `scraped_${key.replace(/\s+/g, "_").toLowerCase()}_${i}`,
        companyKey: key,
        sponsorId: sponsor.id,
        sponsorName: sponsor.organisationName,
        sponsorIndustry: sponsor.industryCategory,
        sponsorTown: sponsor.town,
        title: decodeTitle(s.title),
        location: s.location || sponsor.town || "United Kingdom",
        department: s.department,
        applyUrl: s.url,
        source: "career-page",
        scrapedAt: now,
      }));
  });

  console.log("Scraping career pages (concurrency=25)…");
  const start = Date.now();

  // Wrap the pool so each task's result is pushed immediately — partial
  // progress is preserved even if an unhandled error terminates the process.
  const wrappedTasks = tasks.map((task) => async (): Promise<ScrapedJob[]> => {
    const jobs = await task().catch(() => [] as ScrapedJob[]);
    collectedJobs.push(...jobs);
    return jobs;
  });

  await runPool(wrappedTasks, 25, (done, total) => {
    const pct = ((done / total) * 100).toFixed(1);
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(`\r  ${done}/${total} (${pct}%)  ${elapsed}s elapsed   `);
  });

  saveResults(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  saveResults("Partial results on error");
  process.exit(1);
});
