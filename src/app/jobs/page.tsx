import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsClient } from "@/components/jobs/jobs-client";
import { getLiveJobs } from "@/lib/job-feed";

export const metadata: Metadata = {
  title: "Job Board",
  description:
    "Live UK visa-sponsored jobs fetched directly from licensed employers' own career systems. Every listing is genuine and from a verified sponsor on the Home Office register.",
};

// Re-aggregate the live feeds at most once an hour.
export const revalidate = 3600;

export default async function JobsPage() {
  const jobs = await getLiveJobs();
  return (
    <Suspense fallback={null}>
      <JobsClient jobs={jobs} />
    </Suspense>
  );
}
