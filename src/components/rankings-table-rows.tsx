"use client";

import Link from "next/link";
import { ChevronRight, Lock, MapPin } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { cn } from "@/lib/utils";
import type { Sponsor, SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_ICON: Record<SponsorTier, string> = {
  Platinum: "◆", Gold: "▲", Silver: "■", Bronze: "●", Active: "●", Inactive: "○",
};

const RANK_MEDALS = ["#1", "#2", "#3"] as const;

const FREE_UNLOCKED_ROWS = 3;
const PRO_UNLOCKED_ROWS = 30;

/** Table body rows for the rankings table — top 3 free, top 30 Pro, all Pro Plus. */
export function RankingTableRows({ sponsors }: { sponsors: Sponsor[] }) {
  const { isPro, isProPlus } = useTier();

  return (
    <>
      {sponsors.map((s, i) => {
        const locked = isProPlus ? false : isPro ? i >= PRO_UNLOCKED_ROWS : i >= FREE_UNLOCKED_ROWS;

        return (
          <tr key={s.id} className="group cursor-pointer transition-colors hover:bg-muted/30">
            <td className="px-4 py-4 tabular">
              {i < 3 ? (
                <span className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  i === 0 && "bg-amber-100 text-amber-700",
                  i === 1 && "bg-zinc-100 text-zinc-600",
                  i === 2 && "bg-orange-100 text-orange-700",
                )}>{RANK_MEDALS[i]}</span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
              )}
            </td>

            {locked ? (
              <td colSpan={5} className="px-4 py-4">
                <div className="relative flex items-center justify-between gap-4">
                  <div className="pointer-events-none select-none blur-[6px]" aria-hidden="true">
                    <p className="font-heading text-sm font-semibold leading-snug">{s.organisationName}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="size-3 shrink-0" /> {s.town}</span>
                      <span>{s.industryCategory}</span>
                    </div>
                  </div>
                  <span className="pointer-events-none select-none font-bold tabular blur-[6px]" aria-hidden="true">
                    {s.cos2025Total?.toLocaleString() ?? "—"}
                  </span>
                  <Link
                    href="/pricing"
                    aria-label="Upgrade to Pro to unlock this sponsor"
                    className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-card/60 text-xs font-semibold text-red-600 backdrop-blur-[1px] transition-colors hover:bg-card/80"
                  >
                    <Lock className="size-3.5" /> Upgrade to unlock
                  </Link>
                </div>
              </td>
            ) : (
              <>
                <td className="px-4 py-4">
                  <Link href={`/sponsors/${s.id}`} className="font-heading text-sm font-semibold leading-snug transition-colors hover:text-red-600">
                    {s.organisationName}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                      TIER_BG[s.sponsorTier as SponsorTier]
                    )}>
                      <span className="text-[8px]" aria-hidden="true">{TIER_ICON[s.sponsorTier as SponsorTier]}</span>
                      {s.sponsorTier}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-4 text-sm text-muted-foreground sm:table-cell">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" /> {s.town}
                  </span>
                </td>
                <td className="hidden px-4 py-4 text-sm text-muted-foreground md:table-cell">
                  {s.industryCategory}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold tabular text-foreground">
                    {s.cos2025Total?.toLocaleString() ?? (s.cos2025SwSuppressed ? "< 5" : "—")}
                  </span>
                  {s.cos2025Gbm && s.cos2025Gbm > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      +{s.cos2025Gbm.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-2 py-4">
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
