"use client";

import dynamic from "next/dynamic";
import type { Sponsor } from "@/lib/types";

// Lazy-load Recharts (heavy) so it stays out of the initial bundle.
// Skeleton reserves the exact chart height (h-64) to prevent layout shift (CLS).
const CosChart = dynamic(() => import("./cos-chart").then((m) => m.CosChart), {
  ssr: false,
  loading: () => <div className="skeleton h-64 w-full" aria-label="Loading chart" />,
});

export function CosChartLazy({ sponsor }: { sponsor: Sponsor }) {
  return <CosChart sponsor={sponsor} />;
}
