import type { Metadata } from "next";
import { CommunityClient } from "@/components/community/community-client";

export const metadata: Metadata = {
  title: "Community",
  description: "Real stories and advice from international workers who found UK visa sponsorship. Share your experience.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
