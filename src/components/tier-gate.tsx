"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { cn } from "@/lib/utils";

/**
 * Blurs its children and overlays a lock + upgrade CTA for Free-tier users.
 * Renders children unmodified for Pro/Pro+. Client-only (reads useTier),
 * so it's safe to drop into Server Component trees as a child boundary.
 */
export function BlurGate({
  children,
  message = "Pro feature",
  className,
  blurClassName = "blur-[4px]",
  compact = false,
  iconOnly = false,
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
  blurClassName?: string;
  compact?: boolean;
  /** Show only the lock icon, no label — for tight spaces like inline badges. */
  iconOnly?: boolean;
}) {
  const { isPro } = useTier();
  if (isPro) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div className={cn("pointer-events-none select-none", blurClassName)} aria-hidden="true">
        {children}
      </div>
      <Link
        href="/pricing"
        aria-label={`${message} — upgrade to Pro`}
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 rounded-[inherit] bg-card/50 text-red-600 backdrop-blur-[1px] transition-colors hover:bg-card/70",
          compact ? "text-[10px] font-semibold" : "text-xs font-medium"
        )}
      >
        <Lock className={compact ? "size-3" : "size-3.5"} /> {!iconOnly && message}
      </Link>
    </div>
  );
}
