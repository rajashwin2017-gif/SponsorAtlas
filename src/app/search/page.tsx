import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustryList, getCityList, getRouteList } from "@/lib/sponsor-store";

export const metadata: Metadata = {
  title: "Sponsor Search · SponsorAtlas",
  description:
    "Search 126,349 verified UK visa sponsors with real 2025 CoS hiring data. Filter by tier, activity, industry, city and route.",
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
  // Pass initial filter lists from server so the first render has options immediately
  const initialIndustries = getIndustryList();
  const initialCities = getCityList();
  const initialRoutes = getRouteList();

  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient
        initialIndustries={initialIndustries}
        initialCities={initialCities}
        initialRoutes={initialRoutes}
      />
    </Suspense>
  );
}
