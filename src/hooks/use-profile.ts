"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Profile {
  monthlyChecksUsed: number;
  monthlyChecksLimit: number;
  alertFrequency: string;
}

// Fetches the logged-in user's profile row (GET /api/user/profile) for
// fields that aren't already on the session token (e.g. usage counters).
export function useProfile() {
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [status]);

  return { profile, loading };
}
