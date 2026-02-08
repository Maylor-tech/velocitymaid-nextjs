/**
 * Branch Operator Authentication Helper
 *
 * Validates BRANCH_OPERATOR identity and verifies branch assignment (region scoping).
 * Operators are scoped by primaryBranchId or UserBranch; they only see/act on that branch's jobs.
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";

export interface BranchOperatorAuthResult {
  success: boolean;
  operatorId?: string;
  branchId?: string;
  operator?: {
    id: string;
    name: string | null;
    email: string;
    primaryBranchId: string | null;
  };
  error?: string;
}

/**
 * Get authenticated branch operator from cookie or token.
 * Verifies user is BRANCH_OPERATOR role and has branch assignment.
 */
export async function getAuthenticatedBranchOperator(
  req?: NextRequest,
  requiredBranchId?: string
): Promise<BranchOperatorAuthResult> {
  try {
    const cookieStore = await cookies();
    const operatorIdFromCookie =
      cookieStore.get("branchOperatorId")?.value ||
      cookieStore.get("branchOwnerId")?.value; // Allow shared login flow to set either

    if (operatorIdFromCookie) {
      const operator = await prisma.user.findUnique({
        where: {
          id: operatorIdFromCookie,
          role: UserRole.BRANCH_OPERATOR,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          primaryBranchId: true,
        },
      });

      if (operator) {
        let branchId = operator.primaryBranchId;
        if (!branchId) {
          const userBranch = await prisma.userBranch.findFirst({
            where: { userId: operator.id },
            select: { branchId: true },
          });
          branchId = userBranch?.branchId || null;
        }

        if (!branchId) {
          return {
            success: false,
            error: "Branch operator not assigned to any branch",
          };
        }

        if (requiredBranchId && branchId !== requiredBranchId) {
          return {
            success: false,
            error: "Forbidden: Operator not assigned to this branch",
          };
        }

        return {
          success: true,
          operatorId: operator.id,
          branchId,
          operator: { ...operator, primaryBranchId: branchId },
        };
      }
    }

    if (req) {
      const token =
        req.headers.get("Authorization")?.replace("Bearer ", "") ||
        req.headers.get("branchOperatorToken");

      if (token) {
        const operator = await prisma.user.findUnique({
          where: {
            id: token,
            role: UserRole.BRANCH_OPERATOR,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
          },
        });

        if (operator) {
          let branchId = operator.primaryBranchId;
          if (!branchId) {
            const userBranch = await prisma.userBranch.findFirst({
              where: { userId: operator.id },
              select: { branchId: true },
            });
            branchId = userBranch?.branchId || null;
          }

          if (!branchId) {
            return {
              success: false,
              error: "Branch operator not assigned to any branch",
            };
          }

          if (requiredBranchId && branchId !== requiredBranchId) {
            return {
              success: false,
              error: "Forbidden: Operator not assigned to this branch",
            };
          }

          return {
            success: true,
            operatorId: operator.id,
            branchId,
            operator: { ...operator, primaryBranchId: branchId },
          };
        }
      }
    }

    return {
      success: false,
      error: "Not authenticated as branch operator",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    console.error("[BRANCH_OPERATOR_AUTH] Error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Require branch operator authentication; throws NextResponse if not authenticated.
 */
export async function requireBranchOperator(
  request: NextRequest,
  requiredBranchId?: string
): Promise<BranchOperatorAuthResult> {
  const authResult = await getAuthenticatedBranchOperator(request, requiredBranchId);

  if (!authResult.success) {
    const { NextResponse } = await import("next/server");
    throw NextResponse.json(
      {
        success: false,
        error:
          authResult.error || "Unauthorized: Branch operator authentication required",
      },
      { status: 401 }
    );
  }

  return authResult;
}
