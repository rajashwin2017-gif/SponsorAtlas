"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface AdminSubscription {
  id: string;
  stripeSubscriptionId: string;
  plan: string;
  interval: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  user: { name: string | null; email: string };
}

const STATUS_VARIANT: Record<string, "emerald" | "outline" | "rose" | "amber"> = {
  active: "emerald",
  trialing: "amber",
  canceled: "rose",
  past_due: "rose",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load subscriptions");
        return res.json();
      })
      .then((data) => {
        setSubscriptions(data.subscriptions);
        setTotal(data.total);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} subscriptions on record</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="surface-card divide-y divide-border">
        {subscriptions.length === 0 && !error && (
          <p className="p-5 text-sm text-muted-foreground">No subscriptions yet.</p>
        )}
        {subscriptions.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{s.user.name ?? s.user.email}</p>
                <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>{s.status}</Badge>
                {s.cancelAtPeriodEnd && <Badge variant="amber">Cancels at period end</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {s.plan} · {s.interval}ly · {s.stripeSubscriptionId}
              </p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              Renews {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
