import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";
  const isAdminHost = hostname.startsWith("admin.");

  // admin.localhost:3000 / admin.mydomain.com transparently serve the
  // src/app/admin route tree, keeping the admin UI on its own subdomain
  // without needing a separate deployment.
  if (isAdminHost && !url.pathname.startsWith("/admin")) {
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
