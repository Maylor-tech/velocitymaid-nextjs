import { NextRequest, NextResponse } from "next/server";
import { requireRole, type AuthContext, type RequiredRole } from "@/lib/auth/requireRole";

/**
 * Run an API handler after verifying admin session.
 * Returns 401/403 NextResponse when auth fails.
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (auth: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const auth = await requireRole(request, "ADMIN");
    return await handler(auth);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[API_ADMIN_AUTH]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Re-throw auth responses from catch blocks in route handlers.
 */
export function rethrowIfAuthResponse(error: unknown): NextResponse | null {
  if (error instanceof NextResponse) return error;
  return null;
}

/**
 * Call at the start of a route try block; use rethrowIfAuthResponse in catch.
 */
export async function requireApiRole(
  request: NextRequest,
  role: RequiredRole
): Promise<AuthContext> {
  return requireRole(request, role);
}
