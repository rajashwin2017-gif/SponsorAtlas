"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type Tier = "free" | "pro" | "pro_plus";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

function normalize(raw: string | undefined | null): Tier {
  return raw === "pro" || raw === "pro_plus" ? raw : "free";
}

// Reads subscription tier directly from the DB via /api/user/subscription so
// it is always up-to-date regardless of JWT cache state. Falls back to the
// JWT value while the fetch is in flight.
export function useTier() {
  const { data: session, status } = useSession();
  const jwtTier = normalize(session?.user?.subscriptionTier);
  const [tier, setTier] = useState<Tier>(jwtTier);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.tier) setTier(normalize(data.tier)); })
      .catch(() => {});
  }, [status]);

  return { tier, isPro: tier !== "free", isProPlus: tier === "pro_plus" };
}
