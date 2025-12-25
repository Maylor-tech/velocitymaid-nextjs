/**
 * Phase M: People Stack Validation
 * 
 * Ensures minimum viable team is in place for Miami pilot.
 * No new roles during pilot. No "friends & favors".
 */

import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";

export interface PeopleStackStatus {
  valid: boolean;
  branchOwner: {
    exists: boolean;
    userId?: string;
    name?: string;
    email?: string;
  };
  cleaners: {
    count: number;
    payoutReady: number;
    verified: number;
    list: Array<{
      id: string;
      name: string | null;
      email: string;
      payoutReady: boolean;
      verified: boolean;
    }>;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Validate people stack for Miami pilot
 * 
 * Requirements:
 * - 1 Branch Owner (Ops-focused)
 * - 3-5 Cleaners (verified + payout-ready)
 * - Admin (light-touch, not validated here)
 */
export async function validatePeopleStack(branchId: string): Promise<PeopleStackStatus> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find Branch Owner
  const branchOwner = await prisma.user.findFirst({
    where: {
      primaryBranchId: branchId,
      role: UserRole.BRANCH_OWNER,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!branchOwner) {
    errors.push("No Branch Owner assigned to Miami branch");
  }

  // Find Cleaners
  const cleaners = await prisma.user.findMany({
    where: {
      primaryBranchId: branchId,
      role: UserRole.CLEANER,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Check cleaner payout readiness (Phase J)
  const cleanerDetails = await Promise.all(
    cleaners.map(async (cleaner) => {
      // Check if cleaner has payment method
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          userId: cleaner.id,
          isActive: true,
        },
      });

      // Check if cleaner is verified (has identity verification)
      // This would be in a verification table or user field
      // For now, assume verified if they have a payment method
      const verified = !!paymentMethod;

      return {
        id: cleaner.id,
        name: cleaner.name,
        email: cleaner.email,
        payoutReady: !!paymentMethod,
        verified,
      };
    })
  );

  const payoutReadyCount = cleanerDetails.filter((c) => c.payoutReady).length;
  const verifiedCount = cleanerDetails.filter((c) => c.verified).length;

  // Validate counts
  if (cleaners.length < 3) {
    errors.push(`Insufficient cleaners: ${cleaners.length} (minimum 3 required)`);
  } else if (cleaners.length > 5) {
    warnings.push(`Too many cleaners: ${cleaners.length} (pilot recommends 3-5)`);
  }

  if (payoutReadyCount < 3) {
    errors.push(`Insufficient payout-ready cleaners: ${payoutReadyCount} (minimum 3 required)`);
  }

  if (verifiedCount < cleaners.length) {
    warnings.push(`${cleaners.length - verifiedCount} cleaner(s) not fully verified`);
  }

  return {
    valid: errors.length === 0,
    branchOwner: branchOwner
      ? {
          exists: true,
          userId: branchOwner.id,
          name: branchOwner.name || undefined,
          email: branchOwner.email,
        }
      : {
          exists: false,
        },
    cleaners: {
      count: cleaners.length,
      payoutReady: payoutReadyCount,
      verified: verifiedCount,
      list: cleanerDetails,
    },
    errors,
    warnings,
  };
}

/**
 * Lock role assignments during pilot
 * Prevents new roles from being added to Miami branch
 */
export async function canAssignRoleToBranch(
  branchId: string,
  role: UserRole
): Promise<{ allowed: boolean; reason?: string }> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      slug: true,
      city: true,
    },
  });

  // Only enforce for Miami pilot
  if (branch?.slug !== "miami" && branch?.city?.toLowerCase() !== "miami") {
    return { allowed: true };
  }

  // During pilot, only allow:
  // - Branch Owner (1 only)
  // - Cleaners (3-5 max)
  if (role === UserRole.BRANCH_OWNER) {
    const existing = await prisma.user.count({
      where: {
        primaryBranchId: branchId,
        role: UserRole.BRANCH_OWNER,
        isActive: true,
      },
    });

    if (existing >= 1) {
      return {
        allowed: false,
        reason: "Miami pilot allows only 1 Branch Owner",
      };
    }
  }

  if (role === UserRole.CLEANER) {
    const existing = await prisma.user.count({
      where: {
        primaryBranchId: branchId,
        role: UserRole.CLEANER,
        isActive: true,
      },
    });

    if (existing >= 5) {
      return {
        allowed: false,
        reason: "Miami pilot allows maximum 5 cleaners",
      };
    }
  }

  // Block all other roles during pilot
  if (![UserRole.BRANCH_OWNER, UserRole.CLEANER].includes(role)) {
    return {
      allowed: false,
      reason: `Role ${role} not allowed during Miami pilot`,
    };
  }

  return { allowed: true };
}











