"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "sponsoratlas:saved";

// Lightweight client-side persistence for saved sponsors. In production this
// is backed by the SavedSponsor table via authenticated API routes.
function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
function broadcast() {
  listeners.forEach((l) => l());
}

export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setSaved(read());
    const sync = () => setSaved(read());
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    broadcast();
    return next.includes(id);
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved };
}
