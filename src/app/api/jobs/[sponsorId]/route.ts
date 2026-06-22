import { NextResponse } from "next/server";
import { getSponsorById } from "@/lib/sponsor-store";
import { lookupCareers } from "@/lib/careers-data";

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
  source: "greenhouse" | "lever" | "workable" | "nhs" | "url" | "none";
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

  // ── Greenhouse ──
  if (entry?.type === "greenhouse" && entry.token) {
    const jobs = await fetchGreenhouse(entry.token, keyword);
    return NextResponse.json({
      ...base,
      source: "greenhouse",
      careersUrl: `https://boards.greenhouse.io/${entry.token}`,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  // ── Lever ──
  if (entry?.type === "lever" && entry.token) {
    const jobs = await fetchLever(entry.token, keyword);
    return NextResponse.json({
      ...base,
      source: "lever",
      careersUrl: `https://jobs.lever.co/${entry.token}`,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  // ── Workable ──
  if (entry?.type === "workable" && entry.token) {
    const jobs = await fetchWorkable(entry.token, keyword);
    return NextResponse.json({
      ...base,
      source: "workable",
      careersUrl: `https://apply.workable.com/${entry.token}/`,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  // ── NHS Jobs scrape (no API key needed) ──
  const isNHS =
    entry?.type === "nhs" ||
    /nhs|hospital|health.*trust|trust.*health|foundation trust/i.test(sponsor.organisationName);

  if (isNHS) {
    const city = location || sponsor.town || "";
    const jobs = await fetchNHSJobs(sponsor.organisationName, keyword, city);
    const nhsSearch =
      `https://www.jobs.nhs.uk/candidate/search/results?keyword=${encodeURIComponent(keyword)}` +
      (city ? `&location=${encodeURIComponent(city)}&distance=5` : "");
    return NextResponse.json({
      ...base,
      source: "nhs",
      careersUrl: entry?.url ?? nhsSearch,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  // ── Fallback: careers URL only ──
  return NextResponse.json({
    ...base,
    source: entry ? (entry.type as JobsResponse["source"]) : "none",
    careersUrl: entry?.url,
    jobs: [],
  });
}
