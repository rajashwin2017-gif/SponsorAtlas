"use client";

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import type { Sponsor } from "@/lib/types";

export function CosChart({ sponsor }: { sponsor: Sponsor }) {
  const data = [
    { year: "2022", cos: sponsor.cosActivity2022 },
    { year: "2023", cos: sponsor.cosActivity2023 },
    { year: "2024", cos: sponsor.cosActivity2024 },
    { year: "2025", cos: sponsor.cosActivity2025 },
    { year: "2026", cos: sponsor.cosActivity2026 },
  ];
  const max = Math.max(...data.map((d) => d.cos), 1);

  return (
    <div className="h-64 w-full" role="img" aria-label={`Certificate of Sponsorship activity from 2022 to 2026 for ${sponsor.organisationName}. Latest full year 2025: ${sponsor.cosActivity2025} issued.`}>
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
            formatter={(v: number) => [`${v} issued`, "CoS"]}
          />
          <Bar dataKey="cos" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cos === max ? "url(#cosFill)" : "hsl(0 0% 85%)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
