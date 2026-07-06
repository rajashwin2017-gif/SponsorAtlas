import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export function getSession() {
  return getServerSession(authOptions);
}

// For API routes: throws a typed ApiError so callers can just `await
// requireUser()` and let the shared handleApiError() catch turn it into the
// right HTTP response.
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) throw new ApiError("Not authenticated", 401);
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ApiError("Admin access required", 403);
  return user;
}
