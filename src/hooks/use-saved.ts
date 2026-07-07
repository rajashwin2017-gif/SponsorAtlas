"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Backed by the SavedSponsor table via /api/user/saved-sponsors. Returns
// null from toggle() when the caller isn't signed in, so consumers can
// prompt for login instead of silently no-opping.
export function useSaved() {
  const { status } = useSession();
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setSaved([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/user/saved-sponsors")
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: string[]) => setSaved(ids))
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

      setSaved((prev) => (currentlySaved ? prev.filter((x) => x !== id) : [...prev, id]));
      return !currentlySaved;
    },
    [saved, status]
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved, loading };
}
