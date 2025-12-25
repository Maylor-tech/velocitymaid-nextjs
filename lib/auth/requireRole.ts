import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "../customerSession";
import { getAuthenticatedCleaner } from "../cleanerAuth";
import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

export type RequiredRole = "ADMIN" | "CUSTOMER" | "CLEANER" | "BRANCH_OWNER";

export interface AuthContext {
  userId: string;
  role: RequiredRole;
  email?: string;
}

/**
 * Require a specific role for API route access
 * 
 * @param request - NextRequest
 * @param requiredRole - Required role (ADMIN, CUSTOMER, or CLEANER)
 * @returns AuthContext with user info, or throws NextResponse with error
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: RequiredRole
): Promise<AuthContext> {
  if (requiredRole === "ADMIN") {
    // Check for admin user via session/cookie or header (for testing)
    const cookieStore = await cookies();
    const adminId = 
      cookieStore.get("adminId")?.value || 
      cookieStore.get("adminSession")?.value ||
      request.headers.get("x-admin-id") || // Allow header-based auth for testing
      request.headers.get("authorization")?.replace("Bearer ", ""); // Also check Bearer token
    
    if (!adminId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required" },
        { status: 401 }
      );
      throw response;
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!admin) {
      const response = NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
      throw response;
    }

    return {
      userId: admin.id,
      role: "ADMIN",
      email: admin.email,
    };
  }

  if (requiredRole === "CUSTOMER") {
    const session = await getCustomerSession();
    
    if (!session) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: Customer authentication required" },
        { status: 401 }
      );
      throw response;
    }

    return {
      userId: session.customerId,
      role: "CUSTOMER",
      email: session.email,
    };
  }

  if (requiredRole === "CLEANER") {
    const authResult = await getAuthenticatedCleaner(request);
    
    if (!authResult.success || !authResult.cleanerId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: Cleaner authentication required" },
        { status: 401 }
      );
      throw response;
    }

    return {
      userId: authResult.cleanerId,
      role: "CLEANER",
      email: authResult.cleaner?.email,
    };
  }

  if (requiredRole === "BRANCH_OWNER") {
    const { getAuthenticatedBranchOwner } = await import("@/lib/auth/branchOwnerAuth");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchOwnerId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: Branch owner authentication required" },
        { status: 401 }
      );
      throw response;
    }

    return {
      userId: authResult.branchOwnerId,
      role: "BRANCH_OWNER",
      email: authResult.branchOwner?.email,
    };
  }

  const response = NextResponse.json(
    { success: false, error: "Invalid role requirement" },
    { status: 500 }
  );
  throw response;
}

/**
 * Require customer to own a job
 */
export async function requireCustomerJobOwnership(
  request: NextRequest,
  jobId: string
): Promise<AuthContext> {
  const auth = await requireRole(request, "CUSTOMER");
  
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { customerId: true },
  });

  if (!job) {
    const response = NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
    throw response;
  }

  if (job.customerId !== auth.userId) {
    const response = NextResponse.json(
      { success: false, error: "Forbidden: You can only access your own jobs" },
      { status: 403 }
    );
    throw response;
  }

  return auth;
}

/**
 * Require cleaner to be assigned to a job
 */
export async function requireCleanerJobAssignment(
  request: NextRequest,
  jobId: string
): Promise<AuthContext> {
  const auth = await requireRole(request, "CLEANER");
  
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { assignedCleanerId: true },
  });

  if (!job) {
    const response = NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
    throw response;
  }

  if (!job.assignedCleanerId || job.assignedCleanerId !== auth.userId) {
    const response = NextResponse.json(
      { success: false, error: "Forbidden: You can only access jobs assigned to you" },
      { status: 403 }
    );
    throw response;
  }

  return auth;
}

