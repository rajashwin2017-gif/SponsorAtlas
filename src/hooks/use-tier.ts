"use client";

import { useSession } from "next-auth/react";

export type Tier = "free" | "pro" | "pro_plus";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

function normalize(raw: string | undefined): Tier {
  return raw === "pro" || raw === "pro_plus" ? raw : "free";
}

// Reads the real subscription tier from the authenticated session (set by
// the Stripe webhook sync — see src/lib/auth.ts / src/app/api/stripe/webhook).
export function useTier() {
  const { data: session } = useSession();
  const tier = normalize(session?.user?.subscriptionTier);
  return { tier, isPro: tier !== "free", isProPlus: tier === "pro_plus" };
}
