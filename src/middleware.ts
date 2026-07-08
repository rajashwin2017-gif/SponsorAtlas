import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

// Rendered as-is on the admin subdomain instead of being swept into the
// /admin/* rewrite below — otherwise an unauthenticated visit to
// admin.<domain>/login gets rewritten to /admin/login, fails the auth
// check, and redirects back to /login on the same host, looping forever.
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/admin-login"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";
  const isAdminHost = hostname.startsWith("admin.");
  const isAuthPath = AUTH_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));

  // Redirect admin subdomain requests to the canonical subpath on the main domain
  if (isAdminHost) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    let targetPath = url.pathname;

    if (!isAuthPath && !targetPath.startsWith("/admin")) {
      targetPath = `/admin${targetPath === "/" ? "" : targetPath}`;
    }

    const redirectUrl = new URL(targetPath, appUrl);
    redirectUrl.search = url.search;
    return NextResponse.redirect(redirectUrl);
  }

  // Precise prefix match (not a bare startsWith) — "/admin-login" starts
  // with the string "/admin" too, which previously made this true for it
  // and required auth on the page meant to grant it, looping forever.
  const isAdminRoute = !isAuthPath && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"));
  const isDashboardRoute = url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");

  if (isAdminRoute || isDashboardRoute) {
    const token = await getToken({ req, secret });

    if (!token) {
      const loginUrl = new URL(isAdminRoute ? "/admin-login" : "/login", req.url);
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
