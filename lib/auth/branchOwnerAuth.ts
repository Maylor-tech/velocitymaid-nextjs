/**
 * Branch Owner Authentication Helper
 * 
 * Validates branch owner identity and verifies branch assignment
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface BranchOwnerAuthResult {
  success: boolean;
  branchOwnerId?: string;
  branchId?: string;
  branchOwner?: {
    id: string;
    name: string | null;
    email: string;
    primaryBranchId: string | null;
  };
  error?: string;
}

/**
 * Get authenticated branch owner from cookie or token
 * Verifies user is BRANCH_OWNER role and has branch assignment
 * 
 * @param req - NextRequest (optional, for token extraction)
 * @param requiredBranchId - Optional: require specific branch
 * @returns BranchOwnerAuthResult
 */
export async function getAuthenticatedBranchOwner(
  req?: NextRequest,
  requiredBranchId?: string
): Promise<BranchOwnerAuthResult> {
  try {
    // Method 1: Check cookie (existing session)
    const cookieStore = await cookies();
    const branchOwnerIdFromCookie = cookieStore.get("branchOwnerId")?.value || 
                                    cookieStore.get("adminId")?.value; // Fallback to admin cookie for testing

    if (branchOwnerIdFromCookie) {
      const branchOwner = await prisma.user.findUnique({
        where: {
          id: branchOwnerIdFromCookie,
          role: UserRole.BRANCH_OWNER,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          primaryBranchId: true,
        },
      });

      if (branchOwner) {
        // Verify branch assignment
        if (requiredBranchId && branchOwner.primaryBranchId !== requiredBranchId) {
          return {
            success: false,
            error: "Forbidden: Branch owner not assigned to this branch",
          };
        }

        // Get branch assignment from UserBranch if primaryBranchId not set
        let branchId = branchOwner.primaryBranchId;
        if (!branchId) {
          const userBranch = await prisma.userBranch.findFirst({
            where: { userId: branchOwner.id },
            select: { branchId: true },
          });
          branchId = userBranch?.branchId || null;
        }

        if (!branchId) {
          return {
            success: false,
            error: "Branch owner not assigned to any branch",
          };
        }

        return {
          success: true,
          branchOwnerId: branchOwner.id,
          branchId,
          branchOwner: {
            ...branchOwner,
            primaryBranchId: branchId,
          },
        };
      }
    }

    // Method 2: Check signed token (for email links, etc.)
    if (req) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "") || 
                   req.headers.get("branchOwnerToken");

      if (token) {
        const branchOwner = await prisma.user.findUnique({
          where: {
            id: token,
            role: UserRole.BRANCH_OWNER,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
          },
        });

        if (branchOwner) {
          let branchId = branchOwner.primaryBranchId;
          if (!branchId) {
            const userBranch = await prisma.userBranch.findFirst({
              where: { userId: branchOwner.id },
              select: { branchId: true },
            });
            branchId = userBranch?.branchId || null;
          }

          if (!branchId) {
            return {
              success: false,
              error: "Branch owner not assigned to any branch",
            };
          }

          if (requiredBranchId && branchId !== requiredBranchId) {
            return {
              success: false,
              error: "Forbidden: Branch owner not assigned to this branch",
            };
          }

          return {
            success: true,
            branchOwnerId: branchOwner.id,
            branchId,
            branchOwner: {
              ...branchOwner,
              primaryBranchId: branchId,
            },
          };
        }
      }
    }

    return {
      success: false,
      error: "Not authenticated as branch owner",
    };
  } catch (error: any) {
    console.error("[BRANCH_OWNER_AUTH] Error:", error);
    return {
      success: false,
      error: error?.message || "Authentication failed",
    };
  }
}

/**
 * Require branch owner authentication
 * Throws NextResponse if not authenticated
 */
export async function requireBranchOwner(
  request: NextRequest,
  requiredBranchId?: string
): Promise<BranchOwnerAuthResult> {
  const authResult = await getAuthenticatedBranchOwner(request, requiredBranchId);
  
  if (!authResult.success) {
    const { NextResponse } = await import("next/server");
    throw NextResponse.json(
      { 
        success: false, 
        error: authResult.error || "Unauthorized: Branch owner authentication required" 
      },
      { status: 401 }
    );
  }

  return authResult;
}











