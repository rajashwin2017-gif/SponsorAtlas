import { Suspense } from "react";
import type { Metadata } from "next";
import { SocClient } from "@/components/soc/soc-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "SOC Code Intelligence",
  description: "Look up UK SOC occupation codes, official Skilled Worker going & lower salary rates and Immigration Salary List status, and check visa salary eligibility. Sourced from gov.uk.",
};

export default function SocCodesPage() {
  return (
    <Suspense fallback={<div className="container max-w-4xl py-10"><Skeleton className="mx-auto h-14 w-full max-w-xl" /></div>}>
      <SocClient />
    </Suspense>
  );
}
