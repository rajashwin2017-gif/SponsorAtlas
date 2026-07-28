"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Sponsor } from "@/lib/types";

// Backed by the SavedSponsor table via /api/user/saved-sponsors. Returns
// null from toggle() when the caller isn't signed in, so consumers can
// prompt for login instead of silently no-opping.
export function useSaved() {
  const { status } = useSession();
  const [saved, setSaved] = useState<string[]>([]);
  const [savedSponsors, setSavedSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setSaved([]);
      setSavedSponsors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch("/api/user/saved-sponsors").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/user/saved-sponsors?full=1").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([ids, sponsors]: [string[], Sponsor[]]) => {
        setSaved(ids);
        setSavedSponsors(sponsors);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const toggle = useCallback(
    async (id: string): Promise<boolean | null> => {
      if (status !== "authenticated") return null;

      const currentlySaved = saved.includes(id);
      const res = await fetch(`/api/user/saved-sponsors/${id}`, {
        method: currentlySaved ? "DELETE" : "POST",
      });
      if (!res.ok) return currentlySaved;

      if (currentlySaved) {
        setSaved((prev) => prev.filter((x) => x !== id));
        setSavedSponsors((prev) => prev.filter((s) => s.id !== id));
      } else {
        setSaved((prev) => [...prev, id]);
        // Fetch the full sponsor object for the newly saved sponsor
        fetch(`/api/user/saved-sponsors?full=1`)
          .then((r) => (r.ok ? r.json() : []))
          .then((sponsors: Sponsor[]) => setSavedSponsors(sponsors));
      }
      return !currentlySaved;
    },
    [saved, status]
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, savedSponsors, toggle, isSaved, loading };
}
