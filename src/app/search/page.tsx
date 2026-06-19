import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sponsor Search",
  description: "Search and filter 126,000+ UK visa sponsors by industry, city, route and hiring likelihood.",
};

function SearchFallback() {
  return (
    <div className="container py-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[600px] lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  );
}
