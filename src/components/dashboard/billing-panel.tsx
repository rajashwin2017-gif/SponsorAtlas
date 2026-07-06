"use client";

import { useEffect, useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface SubscriptionInfo {
  tier: string;
  status: string;
  hasBillingAccount: boolean;
  plan: string | null;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface InvoiceRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export function BillingPanel({ email }: { email: string }) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/subscription").then((r) => r.json()).then(setSubscription).catch(() => {});
    fetch("/api/user/invoices").then((r) => r.json()).then(setInvoices).catch(() => {});
  }, []);

  async function openPortal() {
    setBusy("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (data.url) window.location.href = data.url;
    else toast(data.error ?? "Could not open billing portal.", "error");
  }

  async function cancelSubscription() {
    setBusy("cancel");
    const res = await fetch("/api/user/subscription/cancel", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      toast("Your subscription will cancel at the end of the billing period.", "success");
      setSubscription((s) => (s ? { ...s, cancelAtPeriodEnd: true } : s));
    } else {
      toast(data.error ?? "Could not cancel subscription.", "error");
    }
  }

  async function reactivateSubscription() {
    setBusy("reactivate");
    const res = await fetch("/api/user/subscription/reactivate", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      toast("Subscription reactivated.", "success");
      setSubscription((s) => (s ? { ...s, cancelAtPeriodEnd: false } : s));
    } else {
      toast(data.error ?? "Could not reactivate subscription.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface-card divide-y divide-border">
        <div className="flex items-center justify-between p-5">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{email}</p>
        </div>
        <div className="flex items-center justify-between p-5">
          <p className="text-sm text-muted-foreground">Plan</p>
          <div className="flex items-center gap-2">
            <Badge variant={subscription?.tier === "free" || !subscription ? "outline" : "emerald"} className="capitalize">
              {subscription?.plan ?? subscription?.tier ?? "free"}
            </Badge>
            {subscription?.interval && (
              <span className="text-xs capitalize text-muted-foreground">{subscription.interval}ly</span>
            )}
          </div>
        </div>
        {subscription?.currentPeriodEnd && (
          <div className="flex items-center justify-between p-5">
            <p className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? "Access ends" : "Renews"}
            </p>
            <p className="text-sm font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium">Subscription</p>
            <p className="text-xs text-muted-foreground">Manage billing, payment method and invoices via Stripe.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openPortal} disabled={busy === "portal"}>
              {busy === "portal" ? <Loader2 className="size-3.5 animate-spin" /> : null} Manage billing
            </Button>
            {subscription?.hasBillingAccount && subscription.tier !== "free" && (
              subscription.cancelAtPeriodEnd ? (
                <Button variant="outline" size="sm" onClick={reactivateSubscription} disabled={busy === "reactivate"}>
                  {busy === "reactivate" ? <Loader2 className="size-3.5 animate-spin" /> : null} Reactivate
                </Button>
              ) : (
                <Button variant="danger" size="sm" onClick={cancelSubscription} disabled={busy === "cancel"}>
                  {busy === "cancel" ? <Loader2 className="size-3.5 animate-spin" /> : null} Cancel subscription
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Billing history</h3>
        <div className="surface-card divide-y divide-border">
          {invoices.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {inv.status} · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {(inv.pdfUrl || inv.hostedInvoiceUrl) && (
                  <a
                    href={inv.pdfUrl ?? inv.hostedInvoiceUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
                  >
                    <Download className="size-3.5" /> Download
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
