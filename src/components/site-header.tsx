"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Globe2, Menu, X, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/search", label: "Search" },
  { href: "/sponsors/rankings", label: "Rankings" },
  { href: "/soc-codes", label: "SOC Codes" },
  { href: "/pricing", label: "Pricing" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between gap-3 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight text-foreground">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-red-600 to-red-900 text-white shadow-md shadow-red-600/20">
            <Globe2 className="size-4" />
          </span>
          The Sponsor<span className="text-red-500"> Finder</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <nav
            className="flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.04] p-1 backdrop-blur-sm"
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
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:text-white/90"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] px-4 py-1.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/90"
          >
            <User className="size-3.5" /> Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-500"
          >
            <LogIn className="size-3.5" /> Sign in
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="grid size-9 place-items-center rounded-full border border-white/[0.10] bg-white/[0.05] text-white/70 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="container md:hidden">
          <nav
            className="mb-3 flex flex-col gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-2 backdrop-blur-md"
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
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-white/[0.08] text-white" : "text-white/55 hover:text-white/90"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/[0.10] px-4 py-2.5 text-center text-sm font-medium text-white/60"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
