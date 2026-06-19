"use client";

import { useState } from "react";
import { Zap, Loader2, Target, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatGBP, cn } from "@/lib/utils";
import type { FitResult } from "@/lib/fit";
import Link from "next/link";

export function FitWidget({ sponsorId, industry }: { sponsorId: string; industry: string }) {
  const { toast } = useToast();
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYears] = useState("3");
  const [desiredSalary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FitResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim() || !desiredSalary) {
      toast("Add a job title and target salary first.", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          jobTitle,
          yearsExperience: Number(yearsExperience) || 0,
          desiredSalary: Number(desiredSalary) || 0,
          location,
          industry,
        }),
      });
      if (!res.ok) throw new Error("Fit check failed");
      const data: FitResult = await res.json();
      setResult(data);
      toast(`Fit score: ${data.score}/100`, data.score >= 60 ? "success" : "info");
    } catch {
      toast("Could not run fit check. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 70 ? "text-red-600" : s >= 40 ? "text-zinc-700" : "text-zinc-400";
  const ringColor = (s: number) =>
    s >= 70 ? "#dc2626" : s >= 40 ? "#71717a" : "#d4d4d8";

  return (
    <div id="fit" className="surface-card scroll-mt-20 p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-lg bg-zinc-900/15 text-zinc-700">
          <Zap className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-sm font-semibold">AI Sponsorship Fit</h2>
          <p className="text-xs text-muted-foreground">Score your profile against this sponsor</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="fit-title" className="mb-1 block text-xs font-medium text-muted-foreground">
            Job title <span className="text-red-600">*</span>
          </label>
          <Input id="fit-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fit-years" className="mb-1 block text-xs font-medium text-muted-foreground">Experience (yrs)</label>
            <Input id="fit-years" type="number" min={0} max={40} value={yearsExperience} onChange={(e) => setYears(e.target.value)} />
          </div>
          <div>
            <label htmlFor="fit-salary" className="mb-1 block text-xs font-medium text-muted-foreground">
              Target salary <span className="text-red-600">*</span>
            </label>
            <Input id="fit-salary" type="number" min={0} step={500} value={desiredSalary} onChange={(e) => setSalary(e.target.value)} placeholder="45000" />
          </div>
        </div>
        <div>
          <label htmlFor="fit-loc" className="mb-1 block text-xs font-medium text-muted-foreground">Preferred location</label>
          <Input id="fit-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional, e.g. London" />
        </div>
        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="size-4 animate-spin" /> Scoring…</> : <><Zap className="size-4" /> Run Fit Check</>}
        </Button>
      </form>

      {result && (
        <div className="mt-5 space-y-4 border-t border-border pt-5 animate-fade-up">
          {/* Score ring */}
          <div className="flex items-center gap-4">
            <div className="relative grid size-20 shrink-0 place-items-center">
              <svg className="size-20 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(0 0% 90%)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke={ringColor(result.score)} strokeWidth="3"
                  strokeDasharray={`${result.score} 100`} strokeLinecap="round"
                />
              </svg>
              <span className={cn("absolute font-heading text-xl font-bold tabular", scoreColor(result.score))}>
                {result.score}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {result.score >= 70 ? "Strong match" : result.score >= 40 ? "Moderate match" : "Weak match"}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {result.salaryMatch ? (
                  <><CheckCircle2 className="size-3.5 text-red-600" /> Salary meets going rate</>
                ) : (
                  <><AlertTriangle className="size-3.5 text-zinc-600" /> Below going rate</>
                )}
              </p>
              {result.matchedSoc && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Matched SOC {result.matchedSoc.socCode} · {formatGBP(result.matchedSoc.goingRate2026)}
                </p>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {result.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="tabular text-foreground">{b.value}/{b.max}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500"
                    style={{ width: `${(b.value / b.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Gap analysis */}
          <div className="rounded-lg border border-border bg-surface/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Target className="size-3.5 text-zinc-700" /> Gap analysis
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{result.gapAnalysis}</p>
          </div>

          {/* Suggested roles */}
          {result.suggestedRoles.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Suggested roles to target</p>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedRoles.map((r) => (
                  <Badge key={r.socCode} variant="cyan" className="px-2 py-0.5">
                    {r.socCode} · {formatGBP(r.goingRate2026)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Stronger alternatives</p>
              <ul className="space-y-1.5">
                {result.alternatives.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/sponsors/${a.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs transition-colors hover:border-red-600/40"
                    >
                      <span className="truncate">{a.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-red-600">
                        {a.score}/100 <ArrowRight className="size-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
