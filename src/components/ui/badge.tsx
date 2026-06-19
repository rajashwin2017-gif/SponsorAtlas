import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-foreground/70",
        // accent (red) — used for primary highlights
        emerald: "border-red-600/25 bg-red-600/10 text-red-700",
        // neutral/black — secondary emphasis
        cyan: "border-zinc-900/15 bg-zinc-900/5 text-zinc-800",
        // muted neutral — low-emphasis / warning
        amber: "border-zinc-400/40 bg-zinc-500/10 text-zinc-600",
        // strong red — errors / revoked
        rose: "border-red-600/30 bg-red-600/10 text-red-700",
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
