"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Banknote, CheckCircle2, XCircle, Calculator, BadgeCheck, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SOC_CODES } from "@/lib/soc-data";
import { formatGBP, cn } from "@/lib/utils";
import type { SocCode } from "@/lib/types";

export function SocClient() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [selected, setSelected] = useState<SocCode | null>(() => {
    const initial = params.get("q");
    return initial ? SOC_CODES.find((s) => s.socCode === initial) ?? null : null;
  });
  const [salary, setSalary] = useState("");

  const matches = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return [];
    return SOC_CODES.filter(
      (s) =>
        s.socCode.includes(needle) ||
        s.occupationTitle.toLowerCase().includes(needle) ||
        s.industryCategory.toLowerCase().includes(needle)
    ).slice(0, 8);
  }, [q]);

  const salaryNum = Number(salary) || 0;
  const eligible = selected ? salaryNum >= selected.lowerRate2026 : null;
  const meetsGoingRate = selected ? salaryNum >= selected.goingRate2026 : null;

  return (
    <div className="container max-w-4xl py-10">
      <div className="text-center">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">SOC Code Intelligence</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Find your occupation code, 2026 salary thresholds and check eligibility in seconds.
        </p>
      </div>

      {/* Search */}
      <div className="relative mx-auto mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What job do you do? e.g. software developer, nurse, 2136"
          className="h-14 pl-12 text-base"
          autoComplete="off"
          aria-label="Search occupations"
        />
        {matches.length > 0 && (
          <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
            {matches.map((s) => (
              <li key={s.socCode}>
                <button
                  onClick={() => { setSelected(s); setQ(""); }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.occupationTitle}</p>
                    <p className="font-mono text-xs text-zinc-700">SOC {s.socCode} · {s.industryCategory}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular text-red-600">
                    {formatGBP(s.goingRate2026)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Result card */}
      {selected ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card animate-fade-up">
          <div className="border-b border-border bg-surface/50 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan" className="font-mono">SOC {selected.socCode}</Badge>
              <Badge variant="outline">{selected.skillLevel}</Badge>
              <Badge variant="default">{selected.industryCategory}</Badge>
              {selected.isOnIsl && <Badge variant="emerald"><BadgeCheck className="size-3.5" /> Immigration Salary List</Badge>}
              {selected.isOnTsl && <Badge variant="amber"><Clock className="size-3.5" /> Temporary Salary List</Badge>}
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold">{selected.occupationTitle}</h2>
            {selected.description && <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>}
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-card p-6">
              <p className="eyebrow">2026 Going Rate</p>
              <p className="mt-1 font-heading text-3xl font-bold gradient-text tabular">{formatGBP(selected.goingRate2026)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Standard threshold for experienced workers</p>
            </div>
            <div className="bg-card p-6">
              <p className="eyebrow">2026 Lower Rate</p>
              <p className="mt-1 font-heading text-3xl font-bold tabular text-zinc-700">{formatGBP(selected.lowerRate2026)}</p>
              <p className="mt-1 text-xs text-muted-foreground">New entrant / eligible discount rate</p>
            </div>
          </div>

          {/* Eligibility calculator */}
          <div className="border-t border-border p-6">
            <p className="flex items-center gap-2 font-heading text-sm font-semibold">
              <Calculator className="size-4 text-red-600" /> Am I eligible?
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="salary-input" className="mb-1 block text-xs text-muted-foreground">
                  Enter the salary you&apos;re offered (annual, GBP)
                </label>
                <div className="relative">
                  <Banknote className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="salary-input"
                    type="number"
                    min={0}
                    step={500}
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 42000"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {salaryNum > 0 && (
              <div
                className={cn(
                  "mt-4 flex items-start gap-3 rounded-lg border p-4 animate-fade-up",
                  eligible
                    ? "border-red-600/30 bg-red-600/[0.06]"
                    : "border-zinc-300 bg-zinc-100"
                )}
                role="status"
              >
                {eligible ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-red-600" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-zinc-500" />
                )}
                <div className="text-sm">
                  {eligible ? (
                    <>
                      <p className="font-semibold text-red-600">Likely eligible on salary</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {formatGBP(salaryNum)} meets the lower rate of {formatGBP(selected.lowerRate2026)}.{" "}
                        {meetsGoingRate
                          ? "It also clears the full going rate, the strongest position."
                          : `To clear the full going rate you'd need ${formatGBP(selected.goingRate2026)}.`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-zinc-800">Below the salary threshold</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {formatGBP(salaryNum)} is under the lower rate of {formatGBP(selected.lowerRate2026)}. You&apos;d
                        need at least {formatGBP(selected.lowerRate2026 - salaryNum)} more, or a role on the ISL/TSL.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Indicative only. Actual eligibility depends on the specific rules for your route, age and circumstances.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <p className="mb-3 text-center text-sm text-muted-foreground">Popular occupations</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["2136", "2231", "2122", "2421", "6131", "2314", "2162"].map((code) => {
              const s = SOC_CODES.find((x) => x.socCode === code)!;
              return (
                <button
                  key={code}
                  onClick={() => setSelected(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-red-600/40 hover:text-foreground"
                >
                  {s.occupationTitle.split(",")[0].split(" and ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
