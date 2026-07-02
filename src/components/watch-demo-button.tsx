"use client";

import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WatchDemoButton() {
  return (
    <a
      href="#demo"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
    >
      <PlayCircle className="size-4" /> Watch Demo
    </a>
  );
}
