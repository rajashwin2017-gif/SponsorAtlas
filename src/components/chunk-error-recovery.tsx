"use client";

import { useEffect } from "react";

// Catches ChunkLoadError (missing JS chunk after a new deployment) and reloads
// the page once so the browser fetches fresh HTML with updated chunk hashes.
// sessionStorage prevents an infinite reload loop if the chunk is truly absent.
export function ChunkErrorRecovery() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.name !== "ChunkLoadError") return;
      const key = "chunk-reload-v1";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
