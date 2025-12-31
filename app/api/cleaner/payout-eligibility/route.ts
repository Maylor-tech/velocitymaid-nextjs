/**
 * Phase 3A: Cleaner Payout Eligibility API
 * 
 * GET /api/cleaner/payout-eligibility
 * 
 * Returns payout eligibility status for the authenticated cleaner.
 * SAFE MODE: Read-only, no payouts, no writes.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { getPayoutEligibility, getPayoutEligibilityData } from "@/lib/payout/eligibilityService";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Authenticate cleaner
    const authResult = await getAuthenticatedCleaner(request);

    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get payout eligibility (read-only)
    const eligibility = await getPayoutEligibility(authResult.cleanerId);
    const eligibilityData = await getPayoutEligibilityData(authResult.cleanerId);

    // Count pending jobs (assigned but not completed)
    const pendingJobsCount = await prisma.job.count({
      where: {
        assignedCleanerId: authResult.cleanerId,
        status: {
          notIn: ["COMPLETED", "completed", "Completed", "CANCELLED", "cancelled"],
        },
      },
    });

    // Count disputed jobs (using isSuspended as proxy for now)
    const disputedJobsCount = eligibilityData.hasOpenDisputes ? 1 : 0;

    return NextResponse.json({
      success: true,
      eligible: eligibility.isEligible,
      blockerDetails: eligibility.blockerDetails.map((detail, index) => ({
        code: eligibility.blockers[index]?.type || "UNKNOWN",
        label: detail.label,
        message: detail.message,
      })),
      stats: {
        completedJobs: eligibilityData.completedJobsCount,
        pendingJobs: pendingJobsCount,
        disputedJobs: disputedJobsCount,
        eligibleAmountCents: eligibility.eligibleAmountCents,
      },
      rules: {
        minimumCompletedJobs: 3,
      },
    });
  } catch (error: any) {
    console.error("[PAYOUT_ELIGIBILITY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check payout eligibility",
      },
      { status: 500 }
    );
  }
}

