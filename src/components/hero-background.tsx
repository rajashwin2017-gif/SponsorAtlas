// Decorative hero backdrop: minimal skyline silhouettes anchored to the bottom
// corners with planes flying corner-to-corner. Pure SVG + CSS (animations
// respect prefers-reduced-motion via the global rule in globals.css). aria-hidden.

/**
 * Minimal paper-plane glyph, drawn pointing +x (nose right).
 * offset-rotate:auto banks it along the flight arc.
 */
function Plane({
  className, body, fold, scale = 1,
}: { className: string; body: string; fold: string; scale?: number }) {
  return (
    <g className={`plane ${className}`}>
      {/* scale is CSS-driven (--ps) so planes shrink on mobile */}
      <g className="plane-body" style={{ "--ps": scale } as React.CSSProperties}>
        {/* clean dart silhouette */}
        <path d="M30 0 L-24 -17 L-6 0 L-24 17 Z" fill={body} />
        {/* single centre fold */}
        <path d="M30 0 L-6 0" stroke={fold} strokeWidth={1.3} strokeLinecap="round" opacity={0.55} />
      </g>
    </g>
  );
}

const BASE = 220; // skyline viewBox height

/** One building with sparse windows; optional antenna + red beacon. */
function Tower({ x, w, top, beacon = false }: { x: number; w: number; top: number; beacon?: boolean }) {
  const cols = Math.max(2, Math.floor(w / 13));
  const rows = Math.floor((BASE - top - 10) / 14);
  const windows: React.ReactNode[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      n++;
      if (n % 3 === 0) continue; // sparse
      const lit = n % 9 === 0; // occasional red-lit window (accent)
      windows.push(
        <rect
          key={`${r}-${c}`}
          x={x + 5 + c * ((w - 10) / cols)}
          y={top + 9 + r * 14}
          width={3.4}
          height={5}
          rx={0.4}
          fill={lit ? "#dc2626" : "#a1a1aa"}
          opacity={lit ? 0.85 : 0.5}
        />
      );
    }
  }
  return (
    <g>
      <rect x={x} y={top} width={w} height={BASE - top} fill="#d4d4d8" />
      <rect x={x} y={top} width={w} height={4} fill="#a1a1aa" />
      {beacon && (
        <>
          <rect x={x + w / 2 - 0.8} y={top - 12} width={1.6} height={12} fill="#a1a1aa" />
          <circle className="beacon" cx={x + w / 2} cy={top - 13} r={2.4} fill="#dc2626" />
        </>
      )}
      {windows}
    </g>
  );
}

/** A 0..300 × 0..220 cluster of buildings. */
function SkylineCluster() {
  return (
    <>
      <Tower x={4} w={38} top={122} />
      <Tower x={48} w={52} top={48} beacon />
      <Tower x={108} w={34} top={134} />
      <Tower x={150} w={48} top={74} />
      <Tower x={206} w={28} top={150} />
      <Tower x={242} w={46} top={104} />
    </>
  );
}

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Planes — full-bleed layer */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <Plane className="arc-1" body="#27272a" fold="#52525b" scale={1.05} />
        <Plane className="arc-2" body="#dc2626" fold="#7f1d1d" scale={0.85} />
        <Plane className="arc-3" body="#a1a1aa" fold="#d4d4d8" scale={0.7} />
      </svg>

      {/* Left skyline — anchored to bottom-left corner */}
      <svg
        className="absolute bottom-0 left-0 h-auto w-[clamp(150px,24vw,330px)]"
        viewBox="0 0 300 220"
        preserveAspectRatio="xMinYMax meet"
        fill="none"
        opacity={0.6}
      >
        <SkylineCluster />
      </svg>

      {/* Right skyline — mirrored, anchored to bottom-right corner */}
      <svg
        className="absolute bottom-0 right-0 h-auto w-[clamp(150px,24vw,330px)]"
        viewBox="0 0 300 220"
        preserveAspectRatio="xMaxYMax meet"
        fill="none"
        opacity={0.6}
      >
        <g transform="translate(300,0) scale(-1,1)">
          <SkylineCluster />
        </g>
      </svg>
    </div>
  );
}
