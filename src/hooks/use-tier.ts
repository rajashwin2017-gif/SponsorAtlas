"use client";

import { useCallback, useEffect, useState } from "react";

export type Tier = "free" | "pro" | "pro_plus";

const KEY = "sponsoratlas:tier";
const DEFAULT: Tier = "free";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

// Testing-only tier override. This build ships with mock data and no auth, so
// the active plan is kept in localStorage and can be switched from the
// dashboard "Preview as" control. In production the tier comes from the
// authenticated session / Stripe subscription instead.
function read(): Tier {
  if (typeof window === "undefined") return DEFAULT;
  const v = localStorage.getItem(KEY);
  return v === "free" || v === "pro" || v === "pro_plus" ? v : DEFAULT;
}

const listeners = new Set<() => void>();

export function useTier() {
  const [tier, setTierState] = useState<Tier>(DEFAULT);

  useEffect(() => {
    setTierState(read());
    const sync = () => setTierState(read());
    listeners.add(sync);
    window.addEventListener("storage", sync); // cross-tab
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setTier = useCallback((next: Tier) => {
    localStorage.setItem(KEY, next);
    listeners.forEach((l) => l()); // same-tab subscribers (dashboard + search)
  }, []);

  return { tier, setTier, isPro: tier !== "free", isProPlus: tier === "pro_plus" };
}
