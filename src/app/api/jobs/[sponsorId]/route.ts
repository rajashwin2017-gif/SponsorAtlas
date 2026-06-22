import { NextResponse } from "next/server";
import { getSponsorById } from "@/lib/sponsor-store";
import { lookupCareers } from "@/lib/careers-data";

export interface JobListing {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  applyUrl: string;
  postedAt?: string;
}

export interface JobsResponse {
  sponsorId: string;
  companyName: string;
  source: "greenhouse" | "lever" | "url" | "nhs" | "none";
  careersUrl?: string;
  jobs: JobListing[];
  totalJobs?: number;
}

async function fetchGreenhouse(token: string): Promise<JobListing[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
    { next: { revalidate: 3600 } } // cache 1 hour
  );
  if (!res.ok) return [];
  const data = await res.json();
  const jobs: JobListing[] = (data.jobs ?? []).map((j: Record<string, unknown>) => ({
    id: String(j.id),
    title: String(j.title ?? ""),
    location: (j.location as { name?: string })?.name ?? "",
    department: Array.isArray(j.departments) && (j.departments as Record<string,unknown>[])[0]
      ? String((j.departments as Record<string,unknown>[])[0].name ?? "")
      : undefined,
    applyUrl: String(j.absolute_url ?? `https://boards.greenhouse.io/${token}`),
    postedAt: j.updated_at ? String(j.updated_at) : undefined,
  }));
  // Prioritise UK roles
  const uk = jobs.filter(
    (j) =>
      j.location.toLowerCase().includes("uk") ||
      j.location.toLowerCase().includes("united kingdom") ||
      j.location.toLowerCase().includes("london") ||
      j.location.toLowerCase().includes("england") ||
      j.location.toLowerCase().includes("remote")
  );
  return uk.length > 0 ? uk : jobs;
}

async function fetchLever(token: string): Promise<JobListing[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${token}?mode=json&location=United+Kingdom`,
    { next: { revalidate: 3600 } }
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
    postedAt: j.createdAt
      ? new Date(Number(j.createdAt)).toISOString()
      : undefined,
  }));
}

export async function GET(
  _req: Request,
  { params }: { params: { sponsorId: string } }
) {
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
  };

  if (!entry) {
    // Build a generic Google search URL for jobs at this company
    const q = encodeURIComponent(`${sponsor.organisationName} jobs UK`);
    return NextResponse.json({
      ...base,
      source: "url",
      careersUrl: `https://www.google.com/search?q=${q}`,
    });
  }

  if (entry.type === "greenhouse" && entry.token) {
    const jobs = await fetchGreenhouse(entry.token);
    return NextResponse.json({
      ...base,
      source: "greenhouse",
      careersUrl: `https://boards.greenhouse.io/${entry.token}`,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  if (entry.type === "lever" && entry.token) {
    const jobs = await fetchLever(entry.token);
    return NextResponse.json({
      ...base,
      source: "lever",
      careersUrl: `https://jobs.lever.co/${entry.token}`,
      jobs: jobs.slice(0, 20),
      totalJobs: jobs.length,
    });
  }

  // NHS or direct URL
  return NextResponse.json({
    ...base,
    source: entry.type,
    careersUrl: entry.url,
    jobs: [],
  });
}
