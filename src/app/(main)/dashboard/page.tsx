import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your saved sponsors, fit checks and opportunity alerts.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
