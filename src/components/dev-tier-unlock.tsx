"use client";

import { useEffect } from "react";

/**
 * Dev-only helper: auto-unlocks the Pro+ tier in localStorage for local
 * testing. Rendered as a no-op component (returns null) so it never injects
 * a <script> into the document — avoiding React's script-hoisting hydration
 * warnings. Gated to non-production at the call site in the root layout.
 */
export function DevTierUnlock() {
  useEffect(() => {
    try {
      localStorage.setItem("sponsoratlas:tier", "pro_plus");
    } catch {
      /* ignore (e.g. storage disabled) */
    }
  }, []);
  return null;
}
