/**
 * Phase M: Cleaner Onboarding Validation
 * 
 * Enforces Phase J requirements before job assignment.
 * Non-negotiable: No payment method → no assignments.
 */

import { prisma } from "@/lib/prisma";
import { hasVerifiedPaymentMethod } from "@/lib/paymentMethods";

export interface CleanerAssignmentEligibility {
  eligible: boolean;
  reason?: string;
  paymentMethod: {
    exists: boolean;
    verified: boolean;
    status: "none" | "pending" | "rejected" | "verified";
  };
  identityVerified: boolean;
  availabilitySet: boolean;
  blockers: Array<{
    reason: string;
    action: string;
    link?: string;
    severity: "error" | "warning";
  }>;
}

/**
 * Check if cleaner is eligible for job assignment
 * 
 * Requirements (Phase J):
 * - Identity verified
 * - Payment method verified
 * - Availability set (optional for now, can be added later)
 * 
 * Non-negotiable: No payment method → no assignments
 */
export async function checkCleanerAssignmentEligibility(
  cleanerId: string
): Promise<CleanerAssignmentEligibility> {
  const blockers: Array<{
    reason: string;
    action: string;
    link?: string;
    severity: "error" | "warning";
  }> = [];

  // Check cleaner exists and is active
  const cleaner = await prisma.user.findUnique({
    where: { id: cleanerId },
    select: {
      id: true,
      isActive: true,
      role: true,
    },
  });

  if (!cleaner) {
    return {
      eligible: false,
      reason: "Cleaner not found",
      paymentMethod: {
        exists: false,
        verified: false,
        status: "none",
      },
      identityVerified: false,
      availabilitySet: false,
      blockers: [
        {
          reason: "Cleaner not found",
          action: "Verify cleaner ID",
          severity: "error",
        },
      ],
    };
  }

  if (!cleaner.isActive) {
    blockers.push({
      reason: "Cleaner account is not active",
      action: "Activate cleaner account before assignment",
      severity: "error",
    });
  }

  // Check payment method (NON-NEGOTIABLE)
  const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
    where: { cleanerId },
    orderBy: { createdAt: "desc" },
  });

  const paymentMethodStatus = {
    exists: !!paymentMethod,
    verified: !!(paymentMethod?.isActive && paymentMethod?.verifiedAt),
    status: !paymentMethod
      ? ("none" as const)
      : !paymentMethod.isActive && paymentMethod.verificationNote
      ? ("rejected" as const)
      : paymentMethod.isActive && !paymentMethod.verifiedAt
      ? ("pending" as const)
      : ("verified" as const),
  };

  if (!paymentMethodStatus.exists) {
    blockers.push({
      reason: "No payment method on file",
      action: "Cleaner must add a payment method before receiving job assignments",
      link: "/cleaner/payments",
      severity: "error",
    });
  } else if (!paymentMethodStatus.verified) {
    if (paymentMethodStatus.status === "rejected") {
      blockers.push({
        reason: "Payment method was rejected",
        action: "Cleaner must update payment method and wait for verification",
        link: "/cleaner/payments",
        severity: "error",
      });
    } else {
      blockers.push({
        reason: "Payment method pending verification",
        action: "Wait for admin verification (usually within 24 hours)",
        link: "/cleaner/payments",
        severity: "error", // Changed to error for Phase M - no assignments until verified
      });
    }
  }

  // Check identity verification
  // For now, assume verified if cleaner is active and has payment method
  // Can be enhanced later with explicit identity verification table
  const identityVerified = cleaner.isActive && paymentMethodStatus.verified;

  if (!identityVerified && paymentMethodStatus.verified) {
    // Only warn if payment method is verified but identity might not be
    blockers.push({
      reason: "Identity verification status unclear",
      action: "Verify cleaner identity documentation",
      severity: "warning",
    });
  }

  // Check availability (optional for now)
  // Can be enhanced later with availability table
  const availabilitySet = true; // Placeholder - can check availability table later

  // Eligible only if no error blockers
  const eligible =
    cleaner.isActive &&
    paymentMethodStatus.verified &&
    blockers.filter((b) => b.severity === "error").length === 0;

  return {
    eligible,
    reason: eligible
      ? undefined
      : blockers.find((b) => b.severity === "error")?.reason || "Cleaner not eligible for assignment",
    paymentMethod: paymentMethodStatus,
    identityVerified,
    availabilitySet,
    blockers,
  };
}

/**
 * Assert cleaner is eligible for assignment
 * Throws error if not eligible
 */
export async function assertCleanerAssignmentEligible(
  cleanerId: string
): Promise<void> {
  const eligibility = await checkCleanerAssignmentEligibility(cleanerId);

  if (!eligibility.eligible) {
    const errorMessage = eligibility.reason || "Cleaner is not eligible for assignment";
    throw new Error(errorMessage);
  }
}



