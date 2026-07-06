"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

const STATUS_VARIANT: Record<string, "emerald" | "outline" | "rose" | "amber"> = {
  succeeded: "emerald",
  pending: "amber",
  failed: "rose",
  refunded: "outline",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load payments");
      const data = await res.json();
      setPayments(data.payments);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refund(id: string) {
    if (!confirm("Refund this payment via Stripe?")) return;
    const res = await fetch(`/api/admin/payments/${id}/refund`, { method: "POST" });
    if (res.ok) load();
    else alert((await res.json()).error ?? "Refund failed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} payments on record</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="surface-card divide-y divide-border">
        {payments.length === 0 && !error && <p className="p-5 text-sm text-muted-foreground">No payments yet.</p>}
        {payments.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{p.user.name ?? p.user.email}</p>
                <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-medium tabular">
                {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
              </span>
              {p.status === "succeeded" && (
                <Button variant="outline" size="sm" onClick={() => refund(p.id)}>
                  Refund
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
