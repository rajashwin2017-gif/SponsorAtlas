"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/search", label: "Search" },
  { href: "/sponsors/rankings", label: "Rankings" },
  { href: "/jobs", label: "Job Board" },
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
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);

  return (
    <header className="sticky top-0 z-50">
      <div className="container flex items-center justify-between gap-3 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mark.png" alt="The Sponsor Finder" width={40} height={40} className="h-10 w-auto" priority />
          <div className="flex flex-col leading-none">
            <span className="font-heading text-sm font-black tracking-widest text-zinc-900 uppercase">
              The <span className="text-red-600">Sponsor</span> Finder
            </span>
            <div className="my-[3px] h-[2px] w-full bg-red-600" />
            <span className="text-[9px] font-semibold tracking-[0.18em] text-zinc-600 uppercase">
              Find UK Sponsorship Jobs
            </span>
          </div>
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

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-muted"
              >
                <User className="size-4" /> Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/25 transition-colors hover:bg-red-700"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/25 transition-colors hover:bg-red-700"
            >
              <LogIn className="size-4" /> Sign in
            </Link>
          )}
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
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold text-zinc-700"
              >
                Dashboard
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-full bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
