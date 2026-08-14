/**
 * Aggregated live job feed for the /jobs board.
 *
 * Every listing here is GENUINE and CROSS-CHECKED:
 *   1. Jobs are fetched live from the employer's own ATS (Greenhouse, Lever or
 *      Workable) via free, no-auth public APIs — no mock data, no fabrication.
 *   2. Only roles based in the UK are kept (this is a UK-sponsorship board).
 *   3. Every advertising company is matched back to a licensed sponsor on the
 *      Home Office register, so each card links to a real sponsor profile and
 *      carries that sponsor's verified industry. Companies with no register
 *      match are dropped.
 *
 * Fields we don't get from the feeds (SOC code, salary band, skill tags) are
 * left undefined rather than invented.
 *
 * SERVER-ONLY: reads the sponsor dataset from disk. Never import client-side.
 */

import fs from "fs";
import path from "path";
import { getAtsSources, normaliseCompanyName, type AtsSource } from "@/lib/careers-data";
import { getSponsors, type RichSponsor } from "@/lib/sponsor-store";

export type JobFeedSource = "Greenhouse" | "Lever" | "Workable" | "CareerPage";

export interface LiveJob {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorIndustry: string;
  sponsorTown: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  source: JobFeedSource;
  applyUrl: string;
  postedAt?: string;
  postedDaysAgo?: number;
}

// Keep only roles physically in the UK (or explicitly UK-remote). This is a
// UK visa-sponsorship board, so non-UK offices of these employers are excluded.
const UK_LOCATION =
  /(united kingdom|\bu\.?k\.?\b|\bg\.?b\.?\b|\bengland\b|\bscotland\b|\bwales\b|northern ireland|\blondon\b|\bmanchester\b|\bedinburgh\b|\bglasgow\b|\bbirmingham\b|\bleeds\b|\bbristol\b|\bcambridge\b|\boxford\b|\breading\b|\bsheffield\b|\bliverpool\b|\bnottingham\b|\bcardiff\b|\bbelfast\b|\baberdeen\b|\bairdrie\b|\bmacclesfield\b|leigh on sea)/i;

// Non-UK country / US-state patterns that conclusively rule out a UK location.
// Checked BEFORE the UK regex so e.g. "Cambridge, MA, United States" is rejected
// even though "Cambridge" appears in the UK allow-list.
const NON_UK_LOCATION =
  /(?<!northern )\bireland\b|\b(republic of ireland|eire)\b|\b(dublin|cork|galway|limerick|waterford|athlone|leinster|munster|connacht)\b|\b(united states|usa|\bu\.s\.a\.?\b|canada|australia|new zealand|india|germany|france|netherlands|singapore|hong kong|dubai|uae|republic of ireland|new york|california|texas|illinois|massachusetts|washington|florida|georgia|virginia|ohio|michigan|pennsylvania|new jersey|colorado|arizona|minnesota|oregon|wisconsin|connecticut|maryland|missouri|north carolina|south carolina|indiana|tennessee|kentucky|nevada|utah|iowa|arkansas|mississippi|kansas|new mexico|nebraska|west virginia|idaho|new hampshire|maine|rhode island|montana|delaware|north dakota|south dakota|alaska|vermont|wyoming|hawaii|manila|jakarta|kuala lumpur|bangalore|mumbai|delhi|shanghai|beijing|tokyo|seoul|sydney|melbourne|toronto|vancouver|\bny\b|\bca\b|\btx\b|\bma\b|\bwa\b|\bfl\b|\bga\b|\bva\b|\boh\b|\bmi\b|\bpa\b|\bnj\b|\bco\b|\baz\b|\bmn\b|\bor\b|\bwi\b|\bct\b|\bmd\b|\bmo\b|\bnc\b|\bsc\b|\bin\b|\btn\b|\bky\b|\bnv\b|\but\b|\bia\b|\bar\b|\bks\b|\bnm\b|\bne\b|\bwv\b|\bid\b|\bnh\b|\bme\b|\bri\b|\bmt\b|\bde\b|\bnd\b|\bsd\b|\bak\b|\bvt\b|\bwy\b|\bhi\b)\b/i;

function isUkLocation(loc: string): boolean {
  if (!loc) return false;
  if (NON_UK_LOCATION.test(loc)) return false;
  return UK_LOCATION.test(loc);
}

function daysAgo(iso?: string): number | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return undefined;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

// ── ATS fetchers (all free, no auth) ───────────────────────────────────────────

type RawJob = {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  applyUrl: string;
  postedAt?: string;
};

// Per-feed timeout so one slow ATS can't stall the whole board.
const FEED_TIMEOUT_MS = 8000;
function feedSignal() {
  return AbortSignal.timeout(FEED_TIMEOUT_MS);
}

async function fetchGreenhouse(token: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`,
      { next: { revalidate: 3600 }, signal: feedSignal() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? []).map((j: Record<string, unknown>) => ({
      id: String(j.id),
      title: String(j.title ?? ""),
      location: (j.location as { name?: string })?.name ?? "",
      department:
        Array.isArray(j.departments) && (j.departments as Record<string, unknown>[])[0]
          ? String((j.departments as Record<string, unknown>[])[0].name ?? "")
          : undefined,
      // absolute_url is Greenhouse's own authoritative link for this posting —
      // it already resolves correctly whether the employer uses a standard
      // hosted board, an embedded widget on their own domain, or an EU-region
      // board. Guessing our own job-boards.greenhouse.io URL 404s for
      // embedded-widget employers (e.g. GSA Capital, Form3), so don't do that.
      applyUrl: String(j.absolute_url ?? `https://job-boards.greenhouse.io/${token}`),
      postedAt: j.updated_at ? String(j.updated_at) : undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchLever(token: string): Promise<RawJob[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${token}?mode=json`,
      { next: { revalidate: 3600 }, signal: feedSignal() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((j: Record<string, unknown>) => ({
      id: String(j.id ?? ""),
      title: String(j.text ?? ""),
      location: (j.categories as { location?: string })?.location ?? "",
      department: (j.categories as { department?: string })?.department,
      employmentType: (j.categories as { commitment?: string })?.commitment,
      applyUrl: String(j.hostedUrl ?? j.applyUrl ?? ""),
      postedAt: j.createdAt ? new Date(Number(j.createdAt)).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchWorkable(token: string): Promise<RawJob[]> {
  try {
    // Public widget endpoint — the v3 accounts API requires auth/returns 404.
    const res = await fetch(
      `https://apply.workable.com/api/v1/widget/accounts/${token}?details=true`,
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: feedSignal(),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? []).map((j: Record<string, unknown>) => {
      const shortcode = String(j.shortcode ?? j.id ?? "");
      return {
        id: shortcode,
        title: String(j.title ?? ""),
        location: [j.city, j.state, j.country].filter(Boolean).join(", "),
        department: j.department ? String(j.department) : undefined,
        employmentType: j.employment_type ? String(j.employment_type) : undefined,
        // Account-scoped job page — exact role, resolves without a redirect.
        applyUrl: shortcode
          ? `https://apply.workable.com/${token}/j/${shortcode}/`
          : String(j.url ?? j.shortlink ?? ""),
        postedAt: j.published_on ? String(j.published_on) : undefined,
      };
    });
  } catch {
    return [];
  }
}

function fetchSource(src: AtsSource): Promise<RawJob[]> {
  switch (src.type) {
    case "greenhouse":
      return fetchGreenhouse(src.token);
    case "lever":
      return fetchLever(src.token);
    case "workable":
      return fetchWorkable(src.token);
  }
}

const SOURCE_LABEL: Record<AtsSource["type"], JobFeedSource> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  workable: "Workable",
};

// ── Sponsor cross-check ─────────────────────────────────────────────────────────

let _sponsorByKey: Map<string, RichSponsor> | null = null;

/** Map of normalised company name → first matching licensed sponsor. */
function sponsorIndex(): Map<string, RichSponsor> {
  if (_sponsorByKey) return _sponsorByKey;
  const map = new Map<string, RichSponsor>();
  for (const s of getSponsors()) {
    const key = normaliseCompanyName(s.organisationName);
    if (!map.has(key)) map.set(key, s);
  }
  _sponsorByKey = map;
  return map;
}

/** Resolve an ATS source key to a real sponsor (exact, then containment). */
function resolveSponsor(key: string): RichSponsor | undefined {
  const idx = sponsorIndex();
  const exact = idx.get(key);
  if (exact) return exact;
  for (const [sponsorKey, sponsor] of Array.from(idx.entries())) {
    if (sponsorKey.startsWith(key) || sponsorKey.includes(key)) return sponsor;
  }
  return undefined;
}

// ── Live-link verification ──────────────────────────────────────────────────────
// The ATS list APIs can lag behind an employer's own site (a role closes there
// before it drops out of the feed), so before showing a job we confirm its
// apply link actually resolves — anything that 404s/errors is dropped rather
// than risk showing a dead "Apply" button.

const VERIFY_TIMEOUT_MS = 10_000;
const VERIFY_CONCURRENCY = 15;

async function isLinkAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SponsorAtlasLinkCheck/1.0)" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function filterToLiveLinks(jobs: LiveJob[]): Promise<LiveJob[]> {
  const alive: boolean[] = new Array(jobs.length);
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      alive[idx] = await isLinkAlive(jobs[idx].applyUrl);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(VERIFY_CONCURRENCY, jobs.length) }, worker)
  );
  return jobs.filter((_, idx) => alive[idx]);
}

// ── Public aggregator ───────────────────────────────────────────────────────────

function sortByRecency(jobs: LiveJob[]): LiveJob[] {
  return [...jobs].sort((a, b) => {
    // Most-recent first; undefined dates sink to the bottom.
    const at = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const bt = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return bt - at;
  });
}

async function aggregateRaw(): Promise<LiveJob[]> {
  const sources = getAtsSources();
  const atsResults = await Promise.all(
    sources.map(async (src) => {
      const sponsor = resolveSponsor(src.key);
      if (!sponsor) return []; // not on the licensed register → drop
      const raw = await fetchSource(src);
      return raw
        .filter((j) => j.title && isUkLocation(j.location) && j.applyUrl)
        .map<LiveJob>((j) => ({
          id: `${src.type}_${src.token}_${j.id}`,
          sponsorId: sponsor.id,
          sponsorName: sponsor.organisationName,
          sponsorIndustry: sponsor.industryCategory,
          sponsorTown: sponsor.town,
          title: j.title,
          location: j.location,
          department: j.department,
          employmentType: j.employmentType,
          source: SOURCE_LABEL[src.type],
          applyUrl: j.applyUrl,
          postedAt: j.postedAt,
          postedDaysAgo: daysAgo(j.postedAt),
        }));
    })
  );
  return [...atsResults.flat(), ...loadScrapedJobs()];
}

// ── Scraped career-page jobs (written by scripts/scrape-career-pages.ts) ──────

interface ScrapedJobRecord {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorIndustry: string;
  sponsorTown: string;
  title: string;
  location: string;
  department?: string;
  applyUrl: string;
  scrapedAt: string;
}

let _scrapedCache: LiveJob[] | null = null;

function loadScrapedJobs(): LiveJob[] {
  if (_scrapedCache) return _scrapedCache;
  const filePath = path.join(process.cwd(), "prisma", "data", "scraped-jobs.json");
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      jobs: ScrapedJobRecord[];
    };

    // Runtime cross-check: every job must resolve to a sponsor in the live
    // register. This is a belt-and-braces guard — the scraper already enforces
    // this, but we re-verify here so a corrupt/stale file can never leak an
    // unverified listing onto the board.
    const verifiedIds = new Set(getSponsors().map((s) => s.id));

    _scrapedCache = (raw.jobs ?? [])
      .filter((j) => j.sponsorId && j.title && j.applyUrl && verifiedIds.has(j.sponsorId))
      .map<LiveJob>((j) => ({
        id: j.id,
        sponsorId: j.sponsorId,
        sponsorName: j.sponsorName,
        sponsorIndustry: j.sponsorIndustry,
        sponsorTown: j.sponsorTown,
        title: j.title,
        location: j.location,
        department: j.department,
        source: "CareerPage",
        applyUrl: j.applyUrl,
        postedAt: undefined,
        postedDaysAgo: undefined,
      }));
    return _scrapedCache;
  } catch {
    return [];
  }
}

let _cache: { at: number; jobs: LiveJob[] } | null = null;
const CACHE_MS = 3600_000; // 1h, matches the per-feed fetch revalidate

// Verifying ~300 apply links serially-enough-to-matter can take many seconds —
// too slow to block a page navigation on. Kick verification off in the
// background and serve it on the NEXT request once ready, rather than making
// every cold-cache visitor (e.g. the hero search's first click after a
// server restart) wait on it. The unverified list is still cross-checked
// against the licensed register and UK-location filtered — verification only
// catches the rarer case of a listing closing between the ATS feed and the
// employer's own site.
let _verifying = false;

export async function getLiveJobs(): Promise<LiveJob[]> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.jobs;

  const candidates = await aggregateRaw();

  if (!_verifying) {
    _verifying = true;
    filterToLiveLinks(candidates)
      .then((verified) => {
        _cache = { at: Date.now(), jobs: sortByRecency(verified) };
      })
      .catch(() => { /* keep serving the unverified cache on failure */ })
      .finally(() => { _verifying = false; });
  }

  return sortByRecency(candidates);
}
