"use client";

import { useState } from "react";
import { Hash, ShieldCheck, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminToolsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Debug utilities — admin only.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HashTool />
        <VerifyTool />
      </div>
    </div>
  );
}

// ── Hash a password ────────────────────────────────────────────────────────────

function HashTool() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleHash() {
    setError("");
    setHash("");
    if (!password) { setError("Enter a password."); return; }
    setLoading(true);
    const res = await fetch("/api/admin/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hash", password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setHash(data.hash);
  }

  async function copyHash() {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Hash className="size-5 text-red-600" />
        <h2 className="font-semibold text-lg">Hash a password</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Generate a bcrypt hash (12 rounds) for a plain-text password. Use the output in SQL inserts or seed scripts.
      </p>

      <div className="space-y-3">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter plain-text password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHash()}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <Button onClick={handleHash} disabled={loading} className="w-full">
          {loading ? "Hashing…" : "Generate hash"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {hash && (
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">bcrypt hash</p>
          <div className="flex items-start gap-2">
            <code className="break-all text-xs flex-1 text-foreground">{hash}</code>
            <button onClick={copyHash} className="shrink-0 text-muted-foreground hover:text-foreground">
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Verify a password against a hash ──────────────────────────────────────────

function VerifyTool() {
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    setError("");
    setResult(null);
    if (!password || !hash) { setError("Enter both a password and a hash."); return; }
    setLoading(true);
    const res = await fetch("/api/admin/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", password, hash }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setResult(data.match);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-red-600" />
        <h2 className="font-semibold text-lg">Verify a password</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Check whether a plain-text password matches a stored bcrypt hash.
      </p>

      <div className="space-y-3">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Plain-text password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <Input
          type="text"
          placeholder="$2b$12$… bcrypt hash"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="font-mono text-xs"
        />

        <Button onClick={handleVerify} disabled={loading} className="w-full">
          {loading ? "Verifying…" : "Verify"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result !== null && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${result ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
          {result ? (
            <>
              <Check className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Password matches</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">The password is correct for this hash.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="size-5 text-red-600 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">No match</p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">The password does not match this hash.</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
