"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, CreditCard, Receipt, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-10 lg:self-start">
      <div className="surface-card p-5">
        <div className="flex items-center gap-2.5 border-b border-border pb-4">
          <span className="grid size-9 place-items-center rounded-lg bg-zinc-900 text-white">
            <ShieldCheck className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>

        <nav className="mt-4 space-y-0.5" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === n.href
                  ? "bg-zinc-900 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <n.icon className="size-4 shrink-0" /> {n.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" /> Sign out
        </button>
      </div>
    </aside>
  );
}
