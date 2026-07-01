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

import { getAtsSources, normaliseCompanyName, type AtsSource } from "@/lib/careers-data";
import { getSponsors, type RichSponsor } from "@/lib/sponsor-store";

export type JobFeedSource = "Greenhouse" | "Lever" | "Workable";

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
  /(united kingdom|\bu\.?k\.?\b|\bg\.?b\.?\b|\bengland\b|scotland|wales|northern ireland|london|manchester|edinburgh|glasgow|birmingham|leeds|bristol|cambridge|oxford|reading|sheffield|liverpool|nottingham|cardiff|belfast|aberdeen|airdrie|macclesfield|leigh on sea)/i;

function isUkLocation(loc: string): boolean {
  if (!loc) return false;
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
      // Canonical Greenhouse job URL — deep-links to the exact role even when the
      // employer uses an embedded board (e.g. absolute_url points at a careers
      // list with ?gh_jid=). Greenhouse redirects this to the exact branded page.
      applyUrl: j.id
        ? `https://job-boards.greenhouse.io/${token}/jobs/${j.id}`
        : String(j.absolute_url ?? `https://boards.greenhouse.io/${token}`),
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

// ── Public aggregator ───────────────────────────────────────────────────────────

let _cache: { at: number; jobs: LiveJob[] } | null = null;
const CACHE_MS = 3600_000; // 1h, matches the per-feed fetch revalidate

export async function getLiveJobs(): Promise<LiveJob[]> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.jobs;

  const sources = getAtsSources();
  const results = await Promise.all(
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

  const jobs = results.flat().sort((a, b) => {
    // Most-recent first; undefined dates sink to the bottom.
    const at = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const bt = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return bt - at;
  });

  _cache = { at: Date.now(), jobs };
  return jobs;
}
