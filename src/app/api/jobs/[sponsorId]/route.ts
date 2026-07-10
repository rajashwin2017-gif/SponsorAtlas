import { NextResponse } from "next/server";
import { getSponsorById } from "@/lib/sponsor-store";
import { lookupCareers, isUrlAlive } from "@/lib/careers-data";

export interface JobListing {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
  description?: string;
  applyUrl: string;
  postedAt?: string;
}

export interface JobsResponse {
  sponsorId: string;
  companyName: string;
  source: "greenhouse" | "lever" | "workable" | "nhs" | "adzuna" | "url" | "none";
  careersUrl?: string;
  jobs: JobListing[];
  totalJobs?: number;
  keyword?: string;
}

// ── Greenhouse ────────────────────────────────────────────────────────────────

async function fetchGreenhouse(token: string, keyword = ""): Promise<JobListing[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  let jobs: JobListing[] = (data.jobs ?? []).map((j: Record<string, unknown>) => ({
    id: String(j.id),
    title: String(j.title ?? ""),
    location: (j.location as { name?: string })?.name ?? "",
    department: Array.isArray(j.departments) && (j.departments as Record<string, unknown>[])[0]
      ? String((j.departments as Record<string, unknown>[])[0].name ?? "")
      : undefined,
    applyUrl: String(j.absolute_url ?? `https://boards.greenhouse.io/${token}`),
    postedAt: j.updated_at ? String(j.updated_at) : undefined,
  }));
  const uk = jobs.filter((j) =>
    /uk|united kingdom|london|england|scotland|wales|remote/i.test(j.location)
  );
  if (uk.length > 0) jobs = uk;
  if (keyword) {
    const kw = keyword.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        (j.department ?? "").toLowerCase().includes(kw)
    );
  }
  return jobs;
}

// ── Lever ─────────────────────────────────────────────────────────────────────

async function fetchLever(token: string, keyword = ""): Promise<JobListing[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${token}?mode=json`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  let jobs: JobListing[] = data.map((j: Record<string, unknown>) => ({
    id: String(j.id ?? ""),
    title: String(j.text ?? ""),
    location: (j.categories as { location?: string })?.location ?? "",
    department: (j.categories as { department?: string })?.department,
    employmentType: (j.categories as { commitment?: string })?.commitment,
    applyUrl: String(j.hostedUrl ?? j.applyUrl ?? ""),
    postedAt: j.createdAt ? new Date(Number(j.createdAt)).toISOString() : undefined,
  }));
  if (keyword) {
    const kw = keyword.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        (j.department ?? "").toLowerCase().includes(kw)
    );
  }
  return jobs;
}

// ── Workable ──────────────────────────────────────────────────────────────────

async function fetchWorkable(slug: string, keyword = ""): Promise<JobListing[]> {
  const url = `https://apply.workable.com/api/v3/accounts/${slug}/jobs?state=published&limit=20`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  let jobs: JobListing[] = (data.results ?? []).map((j: Record<string, unknown>) => ({
    id: String(j.shortcode ?? j.id ?? ""),
    title: String(j.title ?? ""),
    location: [j.city, j.country].filter(Boolean).join(", "),
    department: j.department ? String(j.department) : undefined,
    employmentType: j.employment_type ? String(j.employment_type) : undefined,
    applyUrl: `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
    postedAt: j.published_on ? String(j.published_on) : undefined,
  }));
  if (keyword) {
    const kw = keyword.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(kw) ||
        (j.department ?? "").toLowerCase().includes(kw)
    );
  }
  return jobs;
}

// ── NHS Jobs (HTML scrape — no API key needed) ────────────────────────────────

function parseSalary(text: string): { min?: number; max?: number; text: string } {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // Extract numbers like £30,000 - £37,000 or £45,996 a year
  const nums = clean.match(/£([\d,]+)/g);
  if (!nums) return { text: clean };
  const values = nums.map((n) => parseInt(n.replace(/[£,]/g, ""), 10));
  return {
    min: values[0],
    max: values[1] ?? values[0],
    text: clean.replace(/Salary:\s*/i, "").trim(),
  };
}

async function fetchNHSJobs(orgName: string, keyword = "", location = ""): Promise<JobListing[]> {
  // NHS Jobs doesn't support reliable org-name filtering via URL params —
  // search by keyword + city of the trust to return relevant local listings.
  const params = new URLSearchParams({
    keyword: keyword || "",
    page: "1",
  });
  // Use supplied location or fall back to empty (national)
  if (location) params.set("location", location);

  const url = `https://www.jobs.nhs.uk/candidate/search/results?${params}`;
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  // Extract job listings via regex on the HTML
  const jobs: JobListing[] = [];

  // Match each job: href to jobadvert and its surrounding title
  // First listing has id="first-result-title", subsequent ones don't — match both
  const titleRe =
    /href="(\/candidate\/jobadvert\/([^?"]+)[^"]*)"(?:\s+id="[^"]*")?\s+data-test="search-result-job-title"\s*>\s*([\s\S]*?)<\/a>/g;

  let m: RegExpExecArray | null;
  while ((m = titleRe.exec(html)) !== null) {
    const href = m[1].replace(/&amp;/g, "&");
    const ref = m[2];
    const title = m[3].replace(/\s+/g, " ").trim();
    if (!title) continue;

    // Look ahead in HTML for salary/location close to this job block
    const blockStart = m.index;
    const blockEnd = Math.min(blockStart + 3000, html.length);
    const block = html.slice(blockStart, blockEnd);

    // Salary
    const salaryMatch = block.match(
      /data-test="search-result-salary"[^>]*>([\s\S]{0,500}?)<\/(?:span|td|div|p)>/
    );
    let salaryInfo: ReturnType<typeof parseSalary> | null = null;
    if (salaryMatch) salaryInfo = parseSalary(salaryMatch[1]);

    // Location
    const locMatch = block.match(
      /data-test="search-result-location"[^>]*>[\s\S]{0,200}?<div class="location-font-size"[^>]*>\s*([\s\S]{0,200}?)\s*(?:<\/div>|<a )/
    );
    const locationText = locMatch
      ? locMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    jobs.push({
      id: ref,
      title,
      location: locationText,
      salaryMin: salaryInfo?.min,
      salaryMax: salaryInfo?.max,
      salaryText: salaryInfo?.text,
      applyUrl: `https://www.jobs.nhs.uk${href}`,
    });
  }

  return jobs;
}

// ── Adzuna ────────────────────────────────────────────────────────────────────

// Strip common legal suffixes so Adzuna's company filter matches the
// employer name advertisers actually use (e.g. "Monzo Bank Ltd" → "Monzo Bank").
function adzunaCompanyQuery(name: string): string {
  return name
    .replace(/\b(ltd|llp|plc|limited|llc|inc|uk|gb)\b\.?/gi, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z0-9&\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function adzunaCall(params: URLSearchParams): Promise<JobListing[]> {
  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((j: Record<string, unknown>) => {
      const loc = j.location as { display_name?: string } | undefined;
      const sal = j.salary_min as number | undefined;
      const salMax = j.salary_max as number | undefined;
      const company = (j.company as { display_name?: string })?.display_name;
      return {
        id: String(j.id ?? ""),
        title: String(j.title ?? ""),
        location: loc?.display_name ?? "",
        department: company ?? undefined,
        salaryMin: sal,
        salaryMax: salMax,
        salaryText: sal ? `£${Math.round(sal / 1000)}k–£${Math.round((salMax ?? sal) / 1000)}k` : undefined,
        description: j.description ? String(j.description).slice(0, 300) : undefined,
        applyUrl: String(j.redirect_url ?? j.adref ?? ""),
        postedAt: j.created ? String(j.created) : undefined,
      } satisfies JobListing;
    });
  } catch {
    return [];
  }
}

async function fetchAdzuna(companyName: string, keyword = ""): Promise<JobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const company = adzunaCompanyQuery(companyName);
  const auth = { app_id: appId, app_key: appKey, results_per_page: "20", where: "UK", content_type: "application/json" };

  // Keyword search: title/keyword scoped to the company across the UK.
  if (keyword) {
    const p = new URLSearchParams({ ...auth, what: keyword });
    if (company) p.set("company", company);
    const scoped = await adzunaCall(p);
    if (scoped.length) return scoped;
    // Fall back to keyword-only UK search if the company filter is too narrow.
    return adzunaCall(new URLSearchParams({ ...auth, what: `${company} ${keyword}`.trim() }));
  }

  // No keyword: list this employer's open UK roles.
  // 1) precise company filter, 2) broad company-name search if that's empty.
  const precise = await adzunaCall(new URLSearchParams({ ...auth, what: company, company }));
  if (precise.length) return precise;
  return adzunaCall(new URLSearchParams({ ...auth, what: company }));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: { sponsorId: string } }
) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") ?? "";
  const location = searchParams.get("location") ?? "";

  const sponsor = getSponsorById(params.sponsorId);
  if (!sponsor) {
    return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
  }

  const entry = lookupCareers(sponsor.organisationName);

  const base: JobsResponse = {
    sponsorId: sponsor.id,
    companyName: sponsor.organisationName,
    source: "none",
    jobs: [],
    keyword,
  };

  // Resolve the primary source (the company's own ATS / NHS feed) and its
  // canonical careers URL. We try this first because it's the most accurate
  // and links straight to the employer's apply flow.
  let primaryJobs: JobListing[] = [];
  let primarySource: JobsResponse["source"] = "none";
  let primaryCareersUrl: string | undefined;

  const isNHS =
    entry?.type === "nhs" ||
    /nhs|hospital|health.*trust|trust.*health|foundation trust/i.test(sponsor.organisationName);

  if (entry?.type === "greenhouse" && entry.token) {
    primaryJobs = await fetchGreenhouse(entry.token, keyword);
    primarySource = "greenhouse";
    primaryCareersUrl = `https://boards.greenhouse.io/${entry.token}`;
  } else if (entry?.type === "lever" && entry.token) {
    primaryJobs = await fetchLever(entry.token, keyword);
    primarySource = "lever";
    primaryCareersUrl = `https://jobs.lever.co/${entry.token}`;
  } else if (entry?.type === "workable" && entry.token) {
    primaryJobs = await fetchWorkable(entry.token, keyword);
    primarySource = "workable";
    primaryCareersUrl = `https://apply.workable.com/${entry.token}/`;
  } else if (isNHS) {
    const city = location || sponsor.town || "";
    primaryJobs = await fetchNHSJobs(sponsor.organisationName, keyword, city);
    primarySource = "nhs";
    primaryCareersUrl =
      entry?.url ??
      `https://www.jobs.nhs.uk/candidate/search/results?keyword=${encodeURIComponent(keyword)}` +
        (city ? `&location=${encodeURIComponent(city)}&distance=5` : "");
  }

  if (primaryJobs.length > 0) {
    return NextResponse.json({
      ...base,
      source: primarySource,
      careersUrl: primaryCareersUrl,
      jobs: primaryJobs.slice(0, 20),
      totalJobs: primaryJobs.length,
    });
  }

  // ── Adzuna fallback ──
  // The primary feed returned nothing (or the sponsor has no public ATS) —
  // surface any live UK jobs for this employer from the Adzuna aggregator so
  // the goal "if a UK job exists, show it" holds for every sponsor.
  const adzunaJobs = await fetchAdzuna(sponsor.organisationName, keyword);
  if (adzunaJobs.length > 0) {
    return NextResponse.json({
      ...base,
      source: "adzuna" as const,
      // Keep the employer's own careers page as the "View all" target when we
      // have one; otherwise the Adzuna apply links still let users through.
      careersUrl: primaryCareersUrl ?? entry?.url,
      jobs: adzunaJobs,
      totalJobs: adzunaJobs.length,
    });
  }

  // ── Last resort: careers URL with keyword pre-filled where possible ──
  let careersUrl = primaryCareersUrl ?? entry?.url;
  if (careersUrl && keyword) {
    // Append keyword to known search-friendly career URLs
    if (careersUrl.includes("amazon.jobs")) {
      careersUrl = `https://www.amazon.jobs/en-gb/search?keywords=${encodeURIComponent(keyword)}&location=United+Kingdom`;
    } else if (careersUrl.includes("careers.google.com")) {
      careersUrl = `https://careers.google.com/jobs/results/?q=${encodeURIComponent(keyword)}&location=United+Kingdom`;
    } else if (careersUrl.includes("careers.microsoft.com")) {
      careersUrl = `https://careers.microsoft.com/us/en/search-results?keywords=${encodeURIComponent(keyword)}&location=United+Kingdom`;
    } else if (careersUrl.includes("metacareers.com")) {
      careersUrl = `https://www.metacareers.com/jobs?q=${encodeURIComponent(keyword)}&offices[0]=London%2C+UK`;
    } else if (careersUrl.includes("tcs.com")) {
      careersUrl = `https://ibegin.tcs.com/iBegin/faces/portlets/AdvancedSearch.xhtml?searchKey=${encodeURIComponent(keyword)}&searchType=keyword`;
    } else if (careersUrl.includes("deloitte.com")) {
      careersUrl = `https://apply.deloitte.com/careers/SearchJobs/${encodeURIComponent(keyword)}?3_56_3=2419&listFilterMode=1`;
    } else if (careersUrl.includes("kpmgcareers")) {
      careersUrl = `https://www.kpmgcareers.co.uk/search/?keyword=${encodeURIComponent(keyword)}`;
    } else if (careersUrl.includes("accenture.com")) {
      careersUrl = `https://www.accenture.com/gb-en/careers/jobsearch?jk=${encodeURIComponent(keyword)}&sb=1&pg=1&is_rj=0&ct=United+Kingdom`;
    } else if (careersUrl.includes("careers.jpmorgan")) {
      careersUrl = `https://careers.jpmorgan.com/global/en/search-jobs?keywords=${encodeURIComponent(keyword)}&location=United+Kingdom`;
    } else if (careersUrl.includes("goldmansachs")) {
      careersUrl = `https://www.goldmansachs.com/careers/search.html#search=%22${encodeURIComponent(keyword)}%22`;
    } else if (careersUrl.includes("hsbc.com/careers")) {
      careersUrl = `https://mycareer.hsbc.com/en_GB/external/SearchJobs/${encodeURIComponent(keyword)}`;
    }
  }
  // Static table URLs (unlike ATS-backed ones) can go stale between our
  // periodic audits — a domain expires, a company rebrands. Confirm this one
  // still resolves before handing it out; if it doesn't, fall through to the
  // guaranteed search link below rather than send someone to a dead page.
  if (careersUrl && !(await isUrlAlive(careersUrl))) {
    careersUrl = undefined;
  }

  // Always guarantee a careersUrl — fall back to Google "site:careers" search
  // so every one of the 126K sponsors has a way for users to explore jobs.
  const fallbackCareersUrl =
    careersUrl ??
    `https://www.google.com/search?q=${encodeURIComponent(`"${sponsor.organisationName}" careers jobs UK`)}`;

  return NextResponse.json({
    ...base,
    // Prefer the resolved primary source (e.g. "nhs" for trusts matched by
    // name with no table entry) so the UI shows the right empty-state CTA.
    source: primarySource !== "none"
      ? primarySource
      : entry
        ? (entry.type as JobsResponse["source"])
        : "none",
    careersUrl: fallbackCareersUrl,
    jobs: [],
  });
}
