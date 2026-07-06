"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "MEMBER" | "ADMIN";
  status: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
  }, [search, load]);

  async function updateUser(id: string, data: Partial<Pick<AdminUser, "role" | "status">>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) load(search);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user permanently? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) load(search);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-10"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="surface-card divide-y divide-border">
        {loading && <p className="p-5 text-sm text-muted-foreground">Loading…</p>}
        {!loading && users.length === 0 && <p className="p-5 text-sm text-muted-foreground">No users found.</p>}
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{u.name ?? "—"}</p>
                <Badge variant={u.role === "ADMIN" ? "emerald" : "outline"}>{u.role}</Badge>
                <Badge variant={u.status === "suspended" ? "rose" : "outline"}>{u.status}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {u.email} · {u.subscriptionTier} ({u.subscriptionStatus})
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {u.role === "MEMBER" ? (
                <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { role: "ADMIN" })}>
                  <ShieldCheck className="size-3.5" /> Promote
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { role: "MEMBER" })}>
                  <ShieldOff className="size-3.5" /> Demote
                </Button>
              )}

              {u.status === "active" ? (
                <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { status: "suspended" })}>
                  <Ban className="size-3.5" /> Suspend
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { status: "active" })}>
                  <CheckCircle2 className="size-3.5" /> Unsuspend
                </Button>
              )}

              <Button variant="danger" size="sm" onClick={() => deleteUser(u.id)}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
