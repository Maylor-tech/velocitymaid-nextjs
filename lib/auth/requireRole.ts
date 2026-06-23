import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "../customerSession";
import { getAuthenticatedCleaner } from "../cleanerAuth";
import { getAuthenticatedBranchOwner } from "./branchOwnerAuth";
import { getAuthenticatedBranchOperator } from "./branchOperatorAuth";
import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { allowLegacyAdminBypass, isLegacyAdminSession } from "./adminBypass";

export type RequiredRole = "ADMIN" | "CUSTOMER" | "CLEANER" | "BRANCH_OWNER" | "BRANCH_OPERATOR";

type AdminBranchRow = { branchId: string; Branch: { name: string } };

/**
 * Resolve the branch scope for an admin user.
 *
 * Full-access ("super"/owner) admins are NOT scoped to a single branch — they
 * can see and manage jobs across every market. An admin is treated as
 * full-access when their email matches ADMIN_EMAIL (the owner account) or when
 * they have access to anything other than exactly one branch.
 *
 * Single-branch admins (e.g. a New-Jersey-only operator) stay scoped to that
 * branch, so their access is unchanged.
 */
function resolveAdminBranchScope(
  email: string | null | undefined,
  branches: AdminBranchRow[]
): { branchId?: string; branchName?: string } {
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isOwner =
    !!ownerEmail && !!email && email.trim().toLowerCase() === ownerEmail;

  if (isOwner || branches.length !== 1) {
    return {};
  }

  return {
    branchId: branches[0].branchId,
    branchName: branches[0].Branch.name,
  };
}

export interface AuthContext {
  userId: string;
  role: RequiredRole;
  email?: string;
  /** Set for ADMIN when session is branch-scoped (from UserBranch) */
  branchId?: string;
  /** Branch display name when branch-scoped */
  branchName?: string;
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
    const cookieStore = await cookies();
    const adminSessionRaw = cookieStore.get("admin_session")?.value;
    const adminId =
      cookieStore.get("adminId")?.value ||
      cookieStore.get("adminSession")?.value ||
      request.headers.get("x-admin-id") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    // Branch-scoped session: { userId, role, branchId } from admin-login
    if (adminSessionRaw) {
      try {
        const session = JSON.parse(adminSessionRaw) as { userId?: string; role?: string; branchId?: string };
        if (session?.userId) {
          const admin = await prisma.user.findUnique({
            where: { id: session.userId, role: UserRole.ADMIN },
            select: { id: true, email: true },
          });
          if (admin) {
            const branches = await prisma.userBranch.findMany({
              where: { userId: admin.id },
              include: { Branch: true },
            });
            return {
              userId: admin.id,
              role: "ADMIN",
              email: admin.email,
              ...resolveAdminBranchScope(admin.email, branches),
            };
          }
        }
      } catch {
        // not JSON, fall through
      }
      // Legacy dev bypass — disabled in production
      if (isLegacyAdminSession(adminSessionRaw) && allowLegacyAdminBypass()) {
        return {
          userId: "local-admin",
          role: "ADMIN",
          email: process.env.ADMIN_EMAIL || "dev-admin@localhost",
        };
      }
    }

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

    const branches = await prisma.userBranch.findMany({
      where: { userId: admin.id },
      include: { Branch: true },
    });
    return {
      userId: admin.id,
      role: "ADMIN",
      email: admin.email,
      ...resolveAdminBranchScope(admin.email, branches),
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

  if (requiredRole === "BRANCH_OPERATOR") {
    const authResult = await getAuthenticatedBranchOperator(request);

    if (!authResult.success || !authResult.operatorId) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: Branch operator authentication required" },
        { status: 401 }
      );
      throw response;
    }

    return {
      userId: authResult.operatorId,
      role: "BRANCH_OPERATOR",
      email: authResult.operator?.email,
    };
  }

  const response = NextResponse.json(
    { success: false, error: "Invalid role requirement" },
    { status: 500 }
  );
  throw response;
}

/**
 * Get admin auth from cookies only (for server components e.g. admin layout).
 * Returns null if no session or invalid; does not throw.
 */
export async function getAdminAuthFromCookies(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const adminSessionRaw = cookieStore.get("admin_session")?.value;
  if (!adminSessionRaw || isLegacyAdminSession(adminSessionRaw)) return null;
  try {
    const session = JSON.parse(adminSessionRaw) as { userId?: string; branchId?: string };
    if (!session?.userId) return null;
    const admin = await prisma.user.findUnique({
      where: { id: session.userId, role: UserRole.ADMIN },
      select: { id: true, email: true },
    });
    if (!admin) return null;
    const branches = await prisma.userBranch.findMany({
      where: { userId: admin.id },
      include: { Branch: true },
    });
    return {
      userId: admin.id,
      role: "ADMIN",
      email: admin.email,
      ...resolveAdminBranchScope(admin.email, branches),
    };
  } catch {
    return null;
  }
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

