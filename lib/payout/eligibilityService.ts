/**
 * Phase 3A: Payout Eligibility Service
 * 
 * Read-only Prisma queries to gather eligibility data.
 * NO WRITES, NO PAYOUTS, NO STRIPE TRANSFERS.
 */

import { prisma } from "@/lib/prisma";
import type { PayoutEligibilityData, PayoutEligibilityResult } from "./eligibilityTypes";
import { evaluatePayoutEligibility } from "./eligibilityRules";
import { getAllBlockerDetails } from "./eligibilityMessages";

/**
 * Get payout eligibility data for a cleaner
 * 
 * SAFE MODE: Read-only queries only
 */
export async function getPayoutEligibilityData(
  cleanerId: string
): Promise<PayoutEligibilityData> {
  // Get cleaner with basic info and Stripe Connect fields
  const cleaner = await prisma.user.findUnique({
    where: { id: cleanerId },
    select: {
      id: true,
      isActive: true,
      isSuspended: true,
      stripeAccountId: true,
      stripePayoutsEnabled: true,
    },
  });

  if (!cleaner) {
    throw new Error(`Cleaner not found: ${cleanerId}`);
  }

  // Count completed jobs (status = "COMPLETED" or "completed" and paymentStatus = "PAID")
  // Note: Job status is a String field, not enum, so we check for both cases
  const completedJobsCount = await prisma.job.count({
    where: {
      assignedCleanerId: cleanerId,
      status: {
        in: ["COMPLETED", "completed", "Completed"], // Handle different case variations
      },
      paymentStatus: "PAID",
      completedAt: { not: null },
    },
  });

  // Check for open disputes/compliance issues
  // Phase D: Use real ComplianceIssue data instead of isSuspended proxy
  const unresolvedComplianceIssues = await prisma.complianceIssue.count({
    where: {
      cleanerId: cleanerId,
      status: { in: ["OPEN", "ESCALATED"] },
    },
  });

  const hasOpenDisputes = unresolvedComplianceIssues > 0;

  // Calculate eligible amount from CleanerBalanceLedger
  // Eligible = CREDIT entries with POSTED status and no payoutTransferId
  const eligibleLedgerEntries = await prisma.cleanerBalanceLedger.findMany({
    where: {
      cleanerId: cleanerId,
      type: "CREDIT",
      status: "POSTED",
      payoutTransferId: null, // Not yet paid out
    },
    select: {
      amountCents: true,
    },
  });

  const eligibleAmountCents = eligibleLedgerEntries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0
  );

  // Phase 3C: Use actual Stripe Connect fields
  const stripeAccountId = cleaner.stripeAccountId;
  // stripeVerified = stripePayoutsEnabled === true
  const stripeAccountVerified = cleaner.stripePayoutsEnabled === true;

  // Admin hold is separate from compliance issues
  // Keep isSuspended as a manual admin freeze switch
  // Compliance issues are tracked separately in ComplianceIssue model
  const adminHold = cleaner.isSuspended || false;

  // Optional: Check tax profile verification status
  // Only gate if tax profile exists and is not verified
  const taxProfile = await prisma.cleanerTaxProfile.findUnique({
    where: { cleanerId },
    select: { status: true },
  });

  const taxProfileVerified =
    taxProfile?.status === "VERIFIED" ? true : taxProfile ? false : undefined;

  return {
    cleanerId,
    completedJobsCount,
    hasOpenDisputes,
    stripeAccountId,
    stripeAccountVerified,
    adminHold,
    eligibleAmountCents,
    taxProfileVerified, // undefined if no profile, false if not verified, true if verified
  };
}

/**
 * Get full payout eligibility result for a cleaner
 * 
 * SAFE MODE: Read-only queries only
 */
export async function getPayoutEligibility(
  cleanerId: string
): Promise<PayoutEligibilityResult> {
  const data = await getPayoutEligibilityData(cleanerId);
  const result = evaluatePayoutEligibility(data);

  // Add user-friendly blocker details
  result.blockerDetails = getAllBlockerDetails(result.blockers, {
    completedJobsCount: data.completedJobsCount,
    eligibleAmountCents: data.eligibleAmountCents,
  });

  return result;
}

/**
 * Get payout eligibility for multiple cleaners (admin view)
 * 
 * SAFE MODE: Read-only queries only
 */
export async function getBulkPayoutEligibility(
  cleanerIds: string[]
): Promise<Map<string, PayoutEligibilityResult>> {
  const results = new Map<string, PayoutEligibilityResult>();

  await Promise.all(
    cleanerIds.map(async (cleanerId) => {
      try {
        const eligibility = await getPayoutEligibility(cleanerId);
        results.set(cleanerId, eligibility);
      } catch (error) {
        // If cleaner not found or error, mark as ineligible
        results.set(cleanerId, {
          isEligible: false,
          eligibleAmountCents: 0,
          blockers: [
            {
              type: "ADMIN_HOLD",
              message: "Error checking eligibility",
            },
          ],
          blockerDetails: [
            {
              label: "Error",
              message: "Unable to check eligibility. Please contact support.",
            },
          ],
        });
      }
    })
  );

  return results;
}

