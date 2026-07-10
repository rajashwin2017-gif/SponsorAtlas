"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Archive, CheckCircle2, AlertTriangle, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  planId: string;
  name: string;
  tagline: string | null;
  badge: string | null;
  highlighted: boolean;
  displayOrder: number;
  monthlyPriceMinor: number;
  yearlyPriceMinor: number;
  features: string[];
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
}

// Features are hardcoded in src/components/pricing-cards.tsx — editing
// them here has no effect on the public pricing page.
const STATIC_FEATURES: Record<string, string[]> = {
  free: [
    "Sponsor licence holder directory",
    "Basic company information",
    "Industry & location filters",
    "Basic search functionality",
    "Limited vacancy views",
    "Publicly available sponsor info",
  ],
  pro: [
    "Everything in Free",
    "Active sponsorship vacancies",
    "Direct employer application links",
    "Unlimited searches",
    "Advanced filtering",
    "Save favourite employers & jobs",
    "Email alerts & notifications",
    "Sponsorship insights",
    "Employer activity updates",
  ],
  pro_plus: [
    "Everything in Pro",
    "Premium candidate profile",
    "CV review tools",
    "AI CV matching",
    "Interview preparation resources",
    "Priority job alerts",
    "Employer recommendations",
    "Application tracking tools",
    "Priority customer support",
    "Early access to new features",
  ],
};

const emptyForm = {
  planId: "",
  name: "",
  tagline: "",
  badge: "",
  highlighted: false,
  displayOrder: 0,
  monthlyPrice: "",
  yearlyPrice: "",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load plans");
      setPlans(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      planId: plan.planId,
      name: plan.name,
      tagline: plan.tagline ?? "",
      badge: plan.badge ?? "",
      highlighted: plan.highlighted,
      displayOrder: plan.displayOrder,
      monthlyPrice: (plan.monthlyPriceMinor / 100).toString(),
      yearlyPrice: (plan.yearlyPriceMinor / 100).toString(),
    });
    setFormError("");
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const body = {
      planId: form.planId,
      name: form.name,
      tagline: form.tagline || undefined,
      badge: form.badge || undefined,
      highlighted: form.highlighted,
      displayOrder: Number(form.displayOrder) || 0,
      monthlyPriceMinor: Math.round(Number(form.monthlyPrice) * 100),
      yearlyPriceMinor: Math.round(Number(form.yearlyPrice) * 100),
      features: STATIC_FEATURES[form.planId] ?? [],
    };

    const res = await fetch(editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...body, planId: undefined } : body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Could not save plan");
      return;
    }

    setShowForm(false);
    load();
  }

  async function archive(id: string) {
    if (!confirm("Archive this plan? It will disappear from the public pricing page.")) return;
    const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage pricing plans shown on the public pricing page.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={startCreate}>
          <Plus className="size-4" /> New plan
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="surface-card space-y-4 p-5">
          <h2 className="text-sm font-semibold">{editingId ? "Edit plan" : "New plan"}</h2>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="size-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Plan ID</label>
              <Input
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                placeholder="pro"
                disabled={Boolean(editingId)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">Lowercase, no spaces. Can't change after creation.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Monthly price (£)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                placeholder="19.99"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Yearly price (£)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.yearlyPrice}
                onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                placeholder="99.99"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tagline (optional)</label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Badge (optional)</label>
              <Input
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Most Popular"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm font-medium">Features</span>
              <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                <Lock className="size-3" /> Fixed — managed in code
              </span>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              {(STATIC_FEATURES[form.planId] ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Save the plan first, then features will appear here based on the Plan ID.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {(STATIC_FEATURES[form.planId] ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="size-3.5 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              To change features, edit <code className="rounded bg-muted px-1">src/components/pricing-cards.tsx</code>.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.highlighted}
              onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
            />
            Highlight this plan (shown as "Most Popular" style card)
          </label>

          <div className="flex gap-2">
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? "Saving…" : "Save plan"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="surface-card divide-y divide-border">
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading…</p>}
        {!loading && plans.length === 0 && <p className="p-5 text-sm text-muted-foreground">No plans yet.</p>}
        {plans.map((plan) => {
          const synced = Boolean(plan.stripeMonthlyPriceId && plan.stripeYearlyPriceId);
          return (
            <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{plan.name}</p>
                  <Badge variant="outline">{plan.planId}</Badge>
                  {plan.highlighted && <Badge variant="emerald">Highlighted</Badge>}
                  {synced ? (
                    <Badge variant="emerald">
                      <CheckCircle2 className="size-3" /> Live
                    </Badge>
                  ) : (
                    <Badge variant="amber">Draft, not synced</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  £{(plan.monthlyPriceMinor / 100).toFixed(2)}/mo · £{(plan.yearlyPriceMinor / 100).toFixed(2)}/yr
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => archive(plan.id)}>
                  <Archive className="size-3.5" /> Archive
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
