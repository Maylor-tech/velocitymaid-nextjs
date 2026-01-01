/**
 * Phase 3A: Admin Payout Eligibility API
 * 
 * GET /api/admin/payout-eligibility?cleanerId=xxx
 * GET /api/admin/payout-eligibility (returns all cleaners)
 * 
 * Returns payout eligibility status for cleaner(s).
 * SAFE MODE: Read-only, no payouts, no writes.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { getPayoutEligibility, getBulkPayoutEligibility } from "@/lib/payout/eligibilityService";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const cleanerId = searchParams.get("cleanerId");

    // Single cleaner query
    if (cleanerId) {
      const eligibility = await getPayoutEligibility(cleanerId);

      // Get cleaner info for context
      const cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isSuspended: true,
        },
      });

      return NextResponse.json({
        success: true,
        cleaner,
        eligibility: {
          isEligible: eligibility.isEligible,
          eligibleAmountCents: eligibility.eligibleAmountCents,
          eligibleAmountDollars: (eligibility.eligibleAmountCents / 100).toFixed(2),
          blockers: eligibility.blockers,
          blockerDetails: eligibility.blockerDetails,
        },
      });
    }

    // Bulk query: get all cleaners and their eligibility
    const cleaners = await prisma.user.findMany({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const cleanerIds = cleaners.map((c) => c.id);
    const eligibilityMap = await getBulkPayoutEligibility(cleanerIds);

    const results = cleaners.map((cleaner) => {
      const eligibility = eligibilityMap.get(cleaner.id);
      return {
        cleaner: {
          id: cleaner.id,
          name: cleaner.name,
          email: cleaner.email,
          isSuspended: cleaner.isSuspended,
        },
        eligibility: eligibility
          ? {
              isEligible: eligibility.isEligible,
              eligibleAmountCents: eligibility.eligibleAmountCents,
              eligibleAmountDollars: (eligibility.eligibleAmountCents / 100).toFixed(2),
              blockers: eligibility.blockers,
              blockerDetails: eligibility.blockerDetails,
            }
          : {
              isEligible: false,
              eligibleAmountCents: 0,
              eligibleAmountDollars: "0.00",
              blockers: [],
              blockerDetails: [],
            },
      };
    });

    // Summary stats
    const eligibleCount = results.filter((r) => r.eligibility.isEligible).length;
    const totalEligibleAmountCents = results.reduce(
      (sum, r) => sum + r.eligibility.eligibleAmountCents,
      0
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalCleaners: cleaners.length,
        eligibleCount,
        ineligibleCount: cleaners.length - eligibleCount,
        totalEligibleAmountCents,
        totalEligibleAmountDollars: (totalEligibleAmountCents / 100).toFixed(2),
      },
      results,
    });
  } catch (error: any) {
    console.error("[ADMIN_PAYOUT_ELIGIBILITY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check payout eligibility",
      },
      { status: 500 }
    );
  }
}

