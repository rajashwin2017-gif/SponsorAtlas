import { Suspense } from "react";
import type { Metadata } from "next";
import { JobsClient } from "@/components/jobs/jobs-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Job Board",
  description: "Browse visa-sponsored UK jobs from licensed employers. Every listing is from a verified sponsor on the Home Office register.",
};

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="container py-14">
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-5 w-72" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    }>
      <JobsClient />
    </Suspense>
  );
}
