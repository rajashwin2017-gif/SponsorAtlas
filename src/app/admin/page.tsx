"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, XCircle, Hourglass, Wallet, Banknote } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  cancelledSubscriptions: number;
  trialUsers: number;
  mrr: number;
  arr: number;
  recentRegistrations: { id: string; name: string | null; email: string; role: string; createdAt: string }[];
  recentPayments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    user: { name: string | null; email: string };
  }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const tiles = [
    { label: "Total users", value: stats.totalUsers, icon: Users },
    { label: "Active subscribers", value: stats.activeSubscribers, icon: CreditCard },
    { label: "Monthly subscribers", value: stats.monthlySubscribers, icon: TrendingUp },
    { label: "Yearly subscribers", value: stats.yearlySubscribers, icon: TrendingUp },
    { label: "Cancelled subscriptions", value: stats.cancelledSubscriptions, icon: XCircle },
    { label: "Trial users", value: stats.trialUsers, icon: Hourglass },
    { label: "MRR", value: `£${stats.mrr.toFixed(2)}`, icon: Wallet },
    { label: "ARR", value: `£${stats.arr.toFixed(2)}`, icon: Banknote },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Key metrics across users, subscriptions and revenue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="surface-card p-5">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <t.icon className="size-3.5" /> {t.label}
            </p>
            <p className="mt-2 font-display text-2xl tabular">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent registrations</h2>
          <div className="surface-card divide-y divide-border">
            {stats.recentRegistrations.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">No users yet.</p>
            )}
            {stats.recentRegistrations.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name ?? u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent payments</h2>
          <div className="surface-card divide-y divide-border">
            {stats.recentPayments.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">No payments yet.</p>
            )}
            {stats.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.user.name ?? p.user.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">{p.status}</p>
                </div>
                <span className="shrink-0 text-sm tabular font-medium">
                  {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
