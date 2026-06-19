"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Globe2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/soc-codes", label: "SOC Codes" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="container flex items-center justify-between gap-3 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-red-600 to-zinc-900 text-white">
            <Globe2 className="size-5" />
          </span>
          <span>
            Sponsor<span className="gradient-text">Atlas</span>
          </span>
        </Link>

        {/* Desktop: floating pill nav + detached CTA pill */}
        <div className="hidden items-center gap-2.5 md:flex">
          <nav
            className="flex items-center gap-1 rounded-full bg-zinc-100 p-1.5 shadow-sm ring-1 ring-black/[0.04]"
            aria-label="Primary"
          >
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "text-red-600"
                      : "text-zinc-700 hover:bg-white hover:text-zinc-950"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/search"
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/25 transition-colors hover:bg-red-700"
          >
            Request Access
          </Link>
        </div>

        {/* Mobile: hamburger inside a pill */}
        <button
          className="grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-black/[0.04] md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="container md:hidden">
          <nav
            className="flex flex-col gap-1 rounded-3xl bg-zinc-100 p-3 shadow-lg ring-1 ring-black/[0.04]"
            aria-label="Mobile"
          >
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                    active ? "text-red-600" : "text-zinc-700 hover:bg-white hover:text-zinc-950"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Request Access
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
