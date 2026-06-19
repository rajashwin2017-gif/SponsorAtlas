"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor — a small red plane (the same minimal jet from the hero flight)
 * that follows the pointer and noses in the direction of movement.
 *
 * Accessibility (per ui-ux-pro-max UX rules):
 * - Only activates on fine pointers (`pointer: fine`) — touch keeps the native cursor.
 * - Disabled when `prefers-reduced-motion: reduce` — native cursor retained.
 * - Purely decorative: aria-hidden, pointer-events: none.
 */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return; // keep the native cursor

    const el = ref.current;
    if (!el) return;

    document.body.classList.add("cursor-3d-active");

    const INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role="button"],[role="switch"],[role="tab"],[onclick]';

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let x = mx, y = my; // rendered position
    let pmx = mx, pmy = my; // previous mouse (velocity)
    let angle = -35; // current heading (deg) — rests nose up-right
    let target = -35;
    let hovering = false;
    let pressing = false;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; el.style.opacity = "1"; }
    };
    const onOver = (e: MouseEvent) => {
      hovering = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
    };
    const onDown = () => { pressing = true; };
    const onUp = () => { pressing = false; };
    const onLeave = () => { visible = false; el.style.opacity = "0"; };

    const tick = () => {
      const vx = mx - pmx;
      const vy = my - pmy;
      pmx = mx; pmy = my;

      // snappy follow (it's a cursor)
      x += (mx - x) * 0.45;
      y += (my - y) * 0.45;

      // nose toward movement direction once moving enough
      const speed = Math.hypot(vx, vy);
      if (speed > 0.8) target = (Math.atan2(vy, vx) * 180) / Math.PI;

      // smooth heading with shortest-path wraparound
      let diff = target - angle;
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      angle += diff * 0.22;

      const s = pressing ? 0.7 : hovering ? 1.35 : 1;
      el.style.transform =
        `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${s})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove("cursor-3d-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-3d cursor-plane" aria-hidden="true">
      {/* same minimal red plane as the hero flight, cursor-sized, nose at +x */}
      <svg width="28" height="20" viewBox="-28 -20 62 40" fill="none">
        <path
          d="M30 0 L-24 -17 L-6 0 L-24 17 Z"
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        />
        <path d="M30 0 L-6 0" stroke="#7f1d1d" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    </div>
  );
}
