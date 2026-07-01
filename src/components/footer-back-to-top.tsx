"use client";

import { ArrowUp } from "lucide-react";

export function FooterBackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="group absolute bottom-6 right-6 z-20 grid size-12 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500/60 hover:bg-red-600 sm:bottom-8 sm:right-8"
    >
      <ArrowUp className="size-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
