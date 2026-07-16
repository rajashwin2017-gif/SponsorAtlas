"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { cn } from "@/lib/utils";
import type { Sponsor, SponsorTier } from "@/lib/types";
import { TIER_BG } from "@/lib/types";

const TIER_EMOJI: Record<SponsorTier, string> = {
  Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉", Active: "●", Inactive: "○",
};

const FREE_UNLOCKED_ROWS = 3;
const PRO_UNLOCKED_ROWS = 30;

/** Table body rows for the city page's top-sponsors table — top 3 free, top 30 Pro, all Pro Plus. */
export function CityTableRows({ sponsors }: { sponsors: Sponsor[] }) {
  const { isPro, isProPlus } = useTier();

  return (
    <>
      {sponsors.map((s, i) => {
        const locked = isProPlus ? false : isPro ? i >= PRO_UNLOCKED_ROWS : i >= FREE_UNLOCKED_ROWS;

        return (
          <tr key={s.id} className="group transition-colors hover:bg-muted/30">
            <td className="px-4 py-3 text-sm font-bold text-muted-foreground tabular">{i + 1}</td>

            {locked ? (
              <td colSpan={3} className="px-4 py-3">
                <div className="relative flex items-center justify-between gap-4">
                  <div className="pointer-events-none select-none blur-[6px]" aria-hidden="true">
                    <span className="font-medium">{s.organisationName}</span>
                    <span className="ml-2 text-muted-foreground">{s.industryCategory}</span>
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
                <td className="px-4 py-3">
                  <Link href={`/sponsors/${s.id}`} className="font-medium hover:text-red-600">
                    {s.organisationName}
                  </Link>
                  <div className="mt-0.5">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-semibold",
                      TIER_BG[s.sponsorTier as SponsorTier]
                    )}>
                      {TIER_EMOJI[s.sponsorTier as SponsorTier]} {s.sponsorTier}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{s.industryCategory}</td>
                <td className="px-4 py-3 text-right font-bold tabular">
                  {s.cos2025Total?.toLocaleString() ?? "< 5"}
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}
