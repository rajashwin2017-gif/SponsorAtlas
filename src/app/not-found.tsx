import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-red-600/10 text-red-600 ring-1 ring-red-600/30">
        <Compass className="size-8" />
      </span>
      <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We couldn&apos;t find that page. The sponsor may have been removed from the register, or the
        link is out of date.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/search" className={cn(buttonVariants({ variant: "gradient" }))}>Search sponsors</Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>Go home</Link>
      </div>
    </div>
  );
}
