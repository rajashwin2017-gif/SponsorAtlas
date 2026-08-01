"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2, Sparkles, ArrowRight, MousePointer2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUERY = "software developer";

const RESULTS = [
  { mono: "MB", name: "Monzo Bank Ltd", city: "London", tier: "Platinum", cos: "1,204", tint: "bg-red-600/10 text-red-700" },
  { mono: "WT", name: "Wayve Technologies Ltd", city: "London", tier: "Gold", cos: "318", tint: "bg-amber-600/10 text-amber-700" },
  { mono: "SK", name: "Skyscanner Limited", city: "Edinburgh", tier: "Gold", cos: "274", tint: "bg-sky-600/10 text-sky-700" },
];

const FIT_BARS = [
  { label: "Salary vs going rate", pct: 96 },
  { label: "SOC code match", pct: 100 },
  { label: "CoS hiring activity", pct: 88 },
];

const SCENES = ["Search", "Employer", "Sponsorship Fit"] as const;
const SCENE_MS = 3600;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Simulated pointer position, relative to the demo's outer wrapper. */
type CursorPos = { x: number; y: number };

export function PlatformDemo() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState("");
  const [fit, setFit] = useState(0);
  const reduced = usePrefersReducedMotion();

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [cursorPos, setCursorPos] = useState<CursorPos | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  // Auto-cycle through scenes (paused on hover/focus).
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setScene((s) => (s + 1) % SCENES.length), SCENE_MS);
    return () => clearInterval(t);
  }, [paused]);

  // Typewriter for the search scene.
  useEffect(() => {
    if (scene !== 0 || reduced) { setTyped(QUERY); return; }
    setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(QUERY.slice(0, i));
      if (i >= QUERY.length) clearInterval(t);
    }, 70);
    return () => clearInterval(t);
  }, [scene, reduced]);

  // Fit meter fill.
  useEffect(() => {
    if (scene === 2) {
      const t = setTimeout(() => setFit(92), reduced ? 0 : 120);
      return () => clearTimeout(t);
    }
    setFit(0);
  }, [scene, reduced]);

  // Simulated cursor: clicks into the search box at the start of scene 0,
  // then slides down to click the next walkthrough tab near the end of
  // every scene — so the demo reads as a real user driving the product.
  useEffect(() => {
    if (paused || reduced) { setCursorVisible(false); return; }
    const wrap = wrapRef.current;
    if (!wrap) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const pointTo = (el: HTMLElement | null, delay: number, withClick: boolean) => {
      if (!el) return;
      timers.push(setTimeout(() => {
        const w = wrap.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        setCursorPos({ x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 });
        setCursorVisible(true);
        if (withClick) {
          timers.push(setTimeout(() => setClicking(true), 550));
          timers.push(setTimeout(() => setClicking(false), 760));
        }
      }, delay));
    };

    if (scene === 0) pointTo(searchBoxRef.current, 200, true);
    pointTo(tabRefs.current[(scene + 1) % SCENES.length], SCENE_MS - 950, true);

    return () => timers.forEach(clearTimeout);
  }, [scene, paused, reduced]);

  const go = (i: number) => { setScene(i); setPaused(true); };

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto max-w-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Simulated cursor — desktop only, decorative */}
      {cursorPos && (
        <div
          className="pointer-events-none absolute -left-3 -top-3 z-30 hidden transition-[opacity,transform] duration-500 ease-out sm:block"
          style={{
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px) scale(${clicking ? 0.85 : 1})`,
            opacity: cursorVisible ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute -inset-2.5 rounded-full bg-red-600/30 transition-transform duration-300",
              clicking ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          />
          <MousePointer2 className="relative size-5 fill-white text-zinc-900 drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]" />
        </div>
      )}

      {/* Faux app window */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-3">
          <span className="size-3 rounded-full bg-red-500/70" aria-hidden="true" />
          <span className="size-3 rounded-full bg-amber-400/70" aria-hidden="true" />
          <span className="size-3 rounded-full bg-emerald-500/70" aria-hidden="true" />
          <div className="ml-3 hidden flex-1 items-center justify-center sm:flex">
            <span className="rounded-md bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground">
              thesponsorfinder.app/search
            </span>
          </div>
        </div>

        {/* Stage */}
        <div className="relative min-h-[320px] p-5 sm:min-h-[360px] sm:p-8">
          {/* Search bar — present in every scene, fills after scene 0 */}
          <div ref={searchBoxRef} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-11 w-full items-center rounded-xl border border-border bg-background pl-10 pr-3 text-sm">
              <span className="text-foreground">{typed}</span>
              {scene === 0 && !reduced && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-red-600" aria-hidden="true" />}
            </div>
          </div>

          {/* Scene body */}
          <div className="mt-5" key={scene}>
            {scene === 0 && (
              <div className="motion-safe:animate-[fade-up_0.4s_ease-out_both]">
                <p className="text-xs text-muted-foreground">Try:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Tech", "London", "A-rated only", "High CoS activity"].map((c) => (
                    <span key={c} className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">{c}</span>
                  ))}
                </div>
                <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-sm text-muted-foreground">Searching 126,000+ verified sponsors…</p>
                </div>
              </div>
            )}

            {scene === 1 && (
              <ul className="space-y-2.5">
                {RESULTS.map((r, i) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 motion-safe:animate-[fade-up_0.45s_ease-out_both]"
                    style={{ animationDelay: `${i * 110}ms` }}
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg font-heading text-xs font-bold", r.tint)}>{r.mono}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.city} · SOC 2134</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-red-600/25 bg-red-600/10 px-2.5 py-0.5 text-[11px] font-medium text-red-700">{r.tier}</span>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-bold tabular">{r.cos}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CoS 2025</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {scene === 2 && (
              <div className="motion-safe:animate-[fade-up_0.4s_ease-out_both]">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Sparkles className="size-3.5 text-red-600" /> Sponsorship Fit
                    </p>
                    <p className="mt-1 font-display text-4xl font-bold gradient-text tabular">{fit}%</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Strong match for Monzo Bank Ltd</p>
                  </div>
                  <div className="relative grid size-20 shrink-0 place-items-center">
                    <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                        className="text-red-600 transition-[stroke-dashoffset] duration-1000 ease-out"
                        strokeDasharray={2 * Math.PI * 15.5}
                        strokeDashoffset={2 * Math.PI * 15.5 * (1 - fit / 100)}
                      />
                    </svg>
                    <CheckCircle2 className="absolute size-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-3 space-y-2.5">
                  {FIT_BARS.map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-semibold tabular">{fit ? b.pct : 0}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-[width] duration-1000 ease-out" style={{ width: `${fit ? b.pct : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls + caption */}
      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3" role="tablist" aria-label="Walkthrough steps">
          {SCENES.map((label, i) => (
            <button
              key={label}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={scene === i}
              aria-label={label}
              onClick={() => go(i)}
              className={cn(
                "group flex items-center gap-1.5 text-xs font-medium transition-colors",
                scene === i ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("h-1.5 rounded-full transition-all duration-300", scene === i ? "w-6 bg-red-600" : "w-1.5 bg-border group-hover:bg-foreground/30")} />
              {label}
            </button>
          ))}
        </div>
        <Link href="/search" className={cn(buttonVariants({ variant: "gradient", size: "sm" }))}>
          Start free search <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
