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
  description?: string;
  applyUrl: string;
  postedAt?: string;
}

export interface JobsResponse {
  sponsorId: string;
  companyName: string;
  source: "greenhouse" | "lever" | "adzuna" | "url" | "nhs" | "none";
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

  // Prefer UK roles
  const uk = jobs.filter((j) =>
    /uk|united kingdom|london|england|scotland|wales|remote/i.test(j.location)
  );
  if (uk.length > 0) jobs = uk;

  // Keyword filter
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
  const url = keyword
    ? `https://api.lever.co/v0/postings/${token}?mode=json`
    : `https://api.lever.co/v0/postings/${token}?mode=json&location=United+Kingdom`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
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

// ── Adzuna ────────────────────────────────────────────────────────────────────
// Free tier: sign up at https://developer.adzuna.com (takes 2 minutes)
// Add ADZUNA_APP_ID and ADZUNA_APP_KEY to your Netlify environment variables.

async function fetchAdzuna(
  companyName: string,
  keyword = "",
  location = "uk"
): Promise<{ jobs: JobListing[]; total: number }> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return { jobs: [], total: 0 };

  const what = keyword
    ? encodeURIComponent(keyword)
    : encodeURIComponent(companyName.split(" ").slice(0, 3).join(" "));
  const company = encodeURIComponent(companyName.split(" ").slice(0, 3).join(" "));
  const where = encodeURIComponent(location || "uk");

  const url =
    `https://api.adzuna.com/v1/api/jobs/gb/search/1` +
    `?app_id=${appId}&app_key=${appKey}` +
    `&what=${what}&company=${company}&where=${where}` +
    `&results_per_page=20&content-type=application/json&sort_by=date`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return { jobs: [], total: 0 };
  const data = await res.json();

  const jobs: JobListing[] = (data.results ?? []).map(
    (j: Record<string, unknown>) => ({
      id: String(j.id ?? ""),
      title: String(j.title ?? ""),
      location: (j.location as { display_name?: string })?.display_name ?? "",
      salaryMin: j.salary_min ? Number(j.salary_min) : undefined,
      salaryMax: j.salary_max ? Number(j.salary_max) : undefined,
      description: j.description
        ? String(j.description).replace(/<[^>]+>/g, "").slice(0, 200)
        : undefined,
      applyUrl: String(j.redirect_url ?? ""),
      postedAt: j.created ? String(j.created) : undefined,
    })
  );

  return { jobs, total: Number(data.count ?? jobs.length) };
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

  // ── Adzuna (universal fallback — needs API key in env) ──
  const { jobs: adzunaJobs, total } = await fetchAdzuna(
    sponsor.organisationName,
    keyword,
    location
  );
  if (adzunaJobs.length > 0) {
    return NextResponse.json({
      ...base,
      source: "adzuna",
      careersUrl: entry?.url,
      jobs: adzunaJobs,
      totalJobs: total,
    });
  }

  // ── Fallback: careers URL only (Adzuna key not configured or no results) ──
  return NextResponse.json({
    ...base,
    source: entry ? entry.type as JobsResponse["source"] : "none",
    careersUrl: entry?.url,
    jobs: [],
  });
}
