import type { Metadata } from "next";
import { CvBuilderClient } from "@/components/cv-builder/cv-builder-client";

export const metadata: Metadata = {
  title: "AI CV Builder",
  description: "Build an ATS-optimised CV for UK Skilled Worker visa applications. Aligned to SOC code requirements.",
};

export default function CvBuilderPage() {
  return <CvBuilderClient />;
}
