"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, BookOpen, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All Categories", "Technology", "Healthcare", "Finance", "Engineering",
  "Education", "Hospitality", "Construction", "Retail", "Consulting",
];

const TABS = [
  { key: "employers" as const, label: "Employers", icon: Building2, href: "/search" },
  { key: "jobs" as const, label: "Search Jobs", icon: Search, href: "/jobs" },
  { key: "guide" as const, label: "Visa Guide", icon: BookOpen, href: "/soc-codes" },
];

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("jobs");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All Categories");

  const active = TABS.find((t) => t.key === tab)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (tab !== "guide") {
      if (location) sp.set("city", location);
      if (category !== "All Categories") sp.set("industry", category);
    }
    const qs = sp.toString();
    router.push(`${active.href}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="surface-card w-full p-2 shadow-lg">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border px-2 pb-2 pt-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.key
                ? "border-b-2 border-red-600 text-red-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Form row */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="hero-q" className="sr-only">
            {tab === "guide" ? "Search the visa guide" : "Job title, keywords or company"}
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="hero-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "guide" ? "Search SOC codes or visa routes" : "Job title, keywords or company"}
            className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-red-600/40"
          />
        </div>

        {tab !== "guide" && (
          <>
            <div className="relative sm:w-40">
              <label htmlFor="hero-location" className="sr-only">Location</label>
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="hero-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-red-600/40"
              />
            </div>

            <div className="sm:w-44">
              <label htmlFor="hero-category" className="sr-only">Category</label>
              <select
                id="hero-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-red-600/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <button type="submit" className={cn(buttonVariants({ variant: "gradient" }), "h-11 shrink-0")}>
          <Search className="size-4" /> Start Free Search
        </button>
      </form>
    </div>
  );
}
