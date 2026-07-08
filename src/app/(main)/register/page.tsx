"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Globe2, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create account. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const passwordStrength = password.length === 0 ? null : password.length < 6 ? "weak" : password.length < 10 ? "fair" : "strong";

  if (success) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-heading text-lg font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 text-white">
              <Globe2 className="size-5" />
            </span>
            Sponsor<span className="gradient-text">Atlas</span>
          </Link>

          <div className="surface-card p-7 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-600/10 text-red-600">
              <Mail className="size-6" />
            </div>
            <h1 className="font-display text-2xl tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
              Please click the link in the email to activate your account.
            </p>
            <Link href="/login" className="block mt-6">
              <Button type="button" className="w-full" variant="outline">
                Go to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-heading text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 text-white">
            <Globe2 className="size-5" />
          </span>
          Sponsor<span className="gradient-text">Atlas</span>
        </Link>

        <div className="surface-card p-7">
          <h1 className="font-display text-2xl tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start finding UK sponsors. Free forever.</p>

          {/* Benefits */}
          <ul className="mt-4 space-y-1.5">
            {["5 free sponsor checks/month", "SOC code salary calculator", "Save sponsors to your shortlist"].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-red-600" /> {b}
              </li>
            ))}
          </ul>

          {/* Google */}
          <Button type="button" variant="outline" className="mt-5 w-full gap-2" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" required className="pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {["weak", "fair", "strong"].map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength === "weak" && i === 0 ? "bg-red-500" :
                          passwordStrength === "fair" && i <= 1 ? "bg-amber-500" :
                          passwordStrength === "strong" ? "bg-emerald-500" :
                          "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{passwordStrength}</span>
                </div>
              )}
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> Creating account…</> : "Create free account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-red-600 hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/" className="underline hover:text-foreground">Terms</Link> and{" "}
          <Link href="/" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
