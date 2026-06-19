"use client";

import { Heart, BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSaved } from "@/hooks/use-saved";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function SponsorActions({ sponsorId, name }: { sponsorId: string; name: string }) {
  const { isSaved, toggle } = useSaved();
  const { toast } = useToast();
  const saved = isSaved(sponsorId);
  const [alertOn, setAlertOn] = useState(false);

  return (
    <div className="surface-card space-y-3 p-5">
      <Button
        variant={saved ? "outline" : "default"}
        className="w-full"
        onClick={() => {
          const now = toggle(sponsorId);
          toast(now ? `Saved ${name}` : `Removed ${name}`, now ? "success" : "info");
        }}
        aria-pressed={saved}
      >
        <Heart className={cn("size-4", saved && "fill-red-600 text-red-600")} />
        {saved ? "Saved" : "Save sponsor"}
      </Button>

      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <BellRing className="size-4 text-zinc-700" /> Opportunity alert
        </span>
        <span
          role="switch"
          aria-checked={alertOn}
          onClick={() => {
            setAlertOn((v) => !v);
            toast(!alertOn ? `Alert set for ${name}` : "Alert removed", !alertOn ? "success" : "info");
          }}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            alertOn ? "bg-red-600" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
              alertOn ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </span>
      </label>
    </div>
  );
}
