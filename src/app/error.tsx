"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload once on ChunkLoadError so users never see this screen
    if (error?.name === "ChunkLoadError") {
      const key = "chunk-reload-v1";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-red-50 text-red-600 text-3xl">
        ⚠️
      </div>
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Something went wrong</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A temporary error occurred. Try refreshing the page.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
