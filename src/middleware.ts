import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

// Rendered as-is on the admin subdomain instead of being swept into the
// /admin/* rewrite below — otherwise an unauthenticated visit to
// admin.<domain>/login gets rewritten to /admin/login, fails the auth
// check, and redirects back to /login on the same host, looping forever.
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";
  const isAdminHost = hostname.startsWith("admin.");
  const isAuthPath = AUTH_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));

  // admin.localhost:3000 / admin.mydomain.com transparently serve the
  // src/app/admin route tree, keeping the admin UI on its own subdomain
  // without needing a separate deployment.
  if (isAdminHost && !isAuthPath && !url.pathname.startsWith("/admin")) {
    url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
  }

  const isAdminRoute = url.pathname.startsWith("/admin");
  const isDashboardRoute = url.pathname.startsWith("/dashboard");

  if (isAdminRoute || isDashboardRoute) {
    const token = await getToken({ req, secret });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (url.pathname !== req.nextUrl.pathname) {
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
