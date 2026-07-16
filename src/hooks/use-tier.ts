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
// JWT value while the fetch is in flight. Call refetch() to re-read instantly
// (e.g. right after a payment sync completes).
export function useTier() {
  const { data: session, status } = useSession();
  const jwtTier = normalize(session?.user?.subscriptionTier);
  // null = DB fetch still in flight (don't show paywalls yet to avoid flash)
  const [tier, setTier] = useState<Tier | null>(null);

  const fetchTier = () =>
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setTier(data?.tier ? normalize(data.tier) : jwtTier); })
      .catch(() => { setTier(jwtTier); });

  useEffect(() => {
    if (status === "unauthenticated") { setTier("free"); return; }
    if (status !== "authenticated") return;
    fetchTier();
  }, [status]);

  const resolved = tier ?? jwtTier;
  return {
    tier: resolved,
    loading: tier === null && status === "authenticated",
    isPro: resolved !== "free",
    isProPlus: resolved === "pro_plus",
    refetch: fetchTier,
  };
}
