import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

// Defense in depth: src/middleware.ts already blocks non-admins from ever
// reaching this route tree, but a server-side check here means the guard
// still holds even if middleware is ever bypassed or misconfigured.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <div className="container grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <AdminNav userName={session.user.name ?? session.user.email ?? "Admin"} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
