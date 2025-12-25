import { requireRole } from "./auth/requireRole";
import { NextRequest } from "next/server";

/**
 * Require admin authentication
 * Uses the same requireRole function that other admin routes use
 */
export async function requireAdmin(request: NextRequest) {
  const auth = await requireRole(request, "ADMIN");
  return {
    id: auth.userId,
    role: "ADMIN" as const,
    email: auth.email || "",
  };
}

