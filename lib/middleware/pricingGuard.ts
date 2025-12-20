/**
 * Phase L: Pricing Guard Middleware
 * 
 * Enforces pricing permissions at the API level.
 * Never trust the client - all checks are server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthContext } from "@/lib/auth/requireRole";
import { assertPricingPermission } from "@/lib/permissions/pricing";
import { prisma } from "@/lib/prisma";
import { assertPriceUnlocked } from "@/lib/pricing/lock";
import { UserRole } from "@prisma/client";

/**
 * Require pricing permission for API route
 * Throws NextResponse if permission denied
 */
export async function requirePricingPermission(
  request: NextRequest,
  permission: 'view' | 'edit' | 'discount' | 'viewHistory' | 'overrideLock'
): Promise<AuthContext> {
  // Get authenticated user
  const auth = await requireRole(request, ["ADMIN", "MANAGER", "BRANCH_OWNER", "SUPPORT"]);
  
  // Map permission string to permission key
  const permissionMap: Record<string, keyof typeof import("@/lib/permissions/pricing").PRICING_PERMISSIONS.ADMIN> = {
    view: "canViewPrices",
    edit: "canEditPrices",
    discount: "canApplyDiscounts",
    viewHistory: "canViewPricingHistory",
    overrideLock: "canOverridePriceLock",
  };

  const permissionKey = permissionMap[permission];
  if (!permissionKey) {
    throw NextResponse.json(
      { success: false, error: "Invalid permission" },
      { status: 400 }
    );
  }

  // Check permission
  try {
    assertPricingPermission(auth.role as UserRole, permissionKey as any);
  } catch (error: any) {
    // Log unauthorized attempt
    console.warn(`[PRICING_GUARD] Unauthorized attempt: ${auth.role} tried to ${permission}`);
    
    throw NextResponse.json(
      { 
        success: false, 
        error: "Permission denied: You do not have permission to perform this action" 
      },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Require that job pricing is not locked
 * Throws NextResponse if locked
 */
export async function requirePriceUnlocked(
  jobId: string
): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      priceLockedAt: true,
      status: true,
    },
  });

  if (!job) {
    throw NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  try {
    assertPriceUnlocked(job as any);
  } catch (error: any) {
    throw NextResponse.json(
      { 
        success: false, 
        error: error.message || "Job pricing is locked and cannot be modified" 
      },
      { status: 403 }
    );
  }
}

/**
 * Require admin role for pricing edits
 * Shorthand for requirePricingPermission with 'edit'
 */
export async function requireAdminPricingAccess(
  request: NextRequest
): Promise<AuthContext> {
  return requirePricingPermission(request, "edit");
}

/**
 * Require admin role for discount application
 * Shorthand for requirePricingPermission with 'discount'
 */
export async function requireAdminDiscountAccess(
  request: NextRequest
): Promise<AuthContext> {
  return requirePricingPermission(request, "discount");
}



