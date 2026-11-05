import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "../customerSession";
import { getAuthenticatedCleaner } from "../cleanerAuth";
import { getAuthenticatedBranchOwner } from "./branchOwnerAuth";
import { getAuthenticatedBranchOperator } from "./branchOperatorAuth";
import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { isBranchScopedAdmin, isOwnerAdmin } from "./adminScope";
import { verifyAdminSession } from "./adminSession";

type CookieReader = { get(name: string): { value: string } | undefined };

/**
 * Read an admin cookie from next/headers first, then the incoming request.
 * Same cookie name and same validation — does not add a weaker auth path.
 * Route Handlers on Vercel can miss cookies() while request.cookies still has them.
 */
export function readAdminCookie(
  cookieStore: CookieReader,
  request: NextRequest,
  name: string
): string | undefined {
  return cookieStore.get(name)?.value || request.cookies.get(name)?.value;
}

export type RequiredRole = "ADMIN" | "CUSTOMER" | "CLEANER" | "BRANCH_OWNER" | "BRANCH_OPERATOR";

type AdminBranchRow = { branchId: string; Branch: { name: string } };

/**
 * Single-branch non-owners stay on that branch.
 * The owner account is unscoped. Several memberships do not make someone the owner;
 * those admins also stay unscoped until branch selection is implemented.
 */
export function resolveAdminBranchScope(
  email: string | null | undefined,
  branches: AdminBranchRow[]
): { branchId?: string; branchName?: string } {
  if (!isBranchScopedAdmin(email, branches.length)) {
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
  /** Explicit owner account. Independent of how many branches are assigned. */
  isOwner?: boolean;
  /** Live UserBranch ids. Non-owners may only query these branches. */
  branchIds?: string[];
}

/** Global billing and other owner actions require the explicit owner account. */
export function assertOwnerAuthorization(auth: AuthContext): void {
  if (auth.isOwner !== true) {
    const response = NextResponse.json(
      { success: false, error: "Forbidden: Owner authorization required" },
      { status: 403 }
    );
    throw response;
  }
}

/** @deprecated Use assertOwnerAuthorization. Owner email, not an absent branch id. */
export const assertSuperAdmin = assertOwnerAuthorization;

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
    const adminSessionRaw = readAdminCookie(cookieStore, request, "admin_session");
    const auth = await getVerifiedAdmin(adminSessionRaw);
    if (!auth) {
      throw NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required" },
        { status: 401 }
      );
    }
    return auth;
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
  return getVerifiedAdmin(cookieStore.get("admin_session")?.value);
}

/** Signature, expiry, active account, and current memberships. Cookie claims do not win. */
async function getVerifiedAdmin(raw: string | undefined): Promise<AuthContext | null> {
  const session = await verifyAdminSession(raw);
  if (!session) return null;
  const admin = await prisma.user.findUnique({
    where: { id: session.userId, role: UserRole.ADMIN, isActive: true },
    select: { id: true, email: true },
  });
  if (!admin) return null;
  const branches = await prisma.userBranch.findMany({
    where: { userId: admin.id },
    include: { Branch: true },
  });
  const currentIds = branches.map((branch) => branch.branchId).sort();
  const signedIds = [...session.branchIds].sort();
  const isOwner = isOwnerAdmin(admin.email);
  const isBranchScoped = isBranchScopedAdmin(admin.email, currentIds.length);
  if (
    !currentIds.length ||
    JSON.stringify(currentIds) !== JSON.stringify(signedIds) ||
    session.isOwner !== isOwner ||
    session.isBranchScoped !== isBranchScoped
  ) {
    return null;
  }
  return {
    userId: admin.id,
    role: "ADMIN",
    email: admin.email,
    isOwner,
    branchIds: currentIds,
    ...resolveAdminBranchScope(admin.email, branches),
  };
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

