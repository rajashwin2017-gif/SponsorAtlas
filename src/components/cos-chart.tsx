"use client";

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import type { Sponsor } from "@/lib/types";

export function CosChart({ sponsor }: { sponsor: Sponsor }) {
  const cos2025 = sponsor.cos2025Sw ?? sponsor.cosActivity2025 ?? 0;
  const cos2025gbm = sponsor.cos2025Gbm ?? 0;

  const data = [
    { year: "2025 SW", cos: cos2025 },
    ...(cos2025gbm > 0 ? [{ year: "2025 GBM", cos: cos2025gbm }] : []),
  ];

  if (data.every((d) => d.cos === 0)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No CoS data available for this sponsor.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.cos), 1);

  return (
    <div
      className="h-48 w-full"
      role="img"
      aria-label={`2025 CoS activity for ${sponsor.organisationName}: ${cos2025} Skilled Worker CoS issued.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="cosFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
          <XAxis dataKey="year" stroke="hsl(0 0% 40%)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(0 0% 40%)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "hsl(0 0% 0% / 0.05)" }}
            contentStyle={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(0 0% 90%)",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "hsl(0 0% 9%)",
              boxShadow: "0 8px 30px -12px hsl(0 0% 0% / 0.25)",
            }}
            labelStyle={{ color: "hsl(0 0% 40%)" }}
            formatter={(v: number) => [`${v.toLocaleString()} issued`, "CoS"]}
          />
          <Bar dataKey="cos" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cos === max ? "url(#cosFill)" : "hsl(0 0% 75%)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
