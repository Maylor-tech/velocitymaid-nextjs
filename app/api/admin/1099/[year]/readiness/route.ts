/**
 * Phase 3H.5: Jan 31 Readiness Score API
 * 
 * GET /api/admin/1099/[year]/readiness
 * 
 * Computes readiness score for cleaners who meet 1099 threshold
 * Per-cleaner score (0-100) using weights:
 * - W-9 VERIFIED = 60
 * - Address complete = 20
 * - Stripe payouts enabled = 10
 * - Statements available = 10
 * 
 * Overall score = average of eligible cleaners
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  // 2025: $600.01 threshold (600100 cents)
  // 2026+: $2000.01 threshold (2000100 cents)
  return year === 2025 ? 600100 : 2000100; // Amounts in cents
}

/**
 * Calculate per-cleaner readiness score (0-100)
 */
function calculateCleanerScore(data: {
  w9Verified: boolean;
  addressComplete: boolean;
  stripePayoutsEnabled: boolean;
  hasStatements: boolean;
}): number {
  let score = 0;

  // W-9 VERIFIED = 60 points
  if (data.w9Verified) {
    score += 60;
  }

  // Address complete = 20 points
  if (data.addressComplete) {
    score += 20;
  }

  // Stripe payouts enabled = 10 points
  if (data.stripePayoutsEnabled) {
    score += 10;
  }

  // Statements available = 10 points
  if (data.hasStatements) {
    score += 10;
  }

  return score;
}

/**
 * Get blocker type for a cleaner
 */
function getBlockerType(data: {
  w9Verified: boolean;
  addressComplete: boolean;
  stripePayoutsEnabled: boolean;
  hasStatements: boolean;
}): string | null {
  if (!data.w9Verified) {
    return "W9_NOT_VERIFIED";
  }
  if (!data.addressComplete) {
    return "ADDRESS_INCOMPLETE";
  }
  if (!data.stripePayoutsEnabled) {
    return "STRIPE_PAYOUTS_DISABLED";
  }
  if (!data.hasStatements) {
    return "NO_STATEMENTS";
  }
  return null; // No blockers
}

export interface CleanerReadiness {
  cleanerId: string;
  cleanerName: string | null;
  cleanerEmail: string;
  score: number;
  w9Verified: boolean;
  addressComplete: boolean;
  stripePayoutsEnabled: boolean;
  hasStatements: boolean;
  blockerType: string | null;
}

export interface ReadinessResponse {
  success: true;
  year: number;
  threshold: number;
  overallScore: number;
  eligibleCleanersCount: number;
  cleaners: CleanerReadiness[];
  blockers: {
    type: string;
    label: string;
    count: number;
    cleanerIds: string[];
  }[];
  // Phase 3H.7: Jan 31 Countdown Mode
  countdown?: {
    active: boolean;
    daysRemaining: number;
    phase: "NORMAL" | "WARNING" | "CRITICAL";
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year parameter" },
        { status: 400 }
      );
    }

    // Phase 3H.11: Check if year is archived - return archived data
    const archive = await prisma.taxYearArchive.findUnique({
      where: { year },
    });

    if (archive) {
      return NextResponse.json({
        success: true,
        year,
        threshold: get1099Threshold(year) / 100,
        overallScore: archive.readinessScore,
        eligibleCleanersCount: (archive.summaryJson as any)?.eligibleCleaners || 0,
        cleaners: [],
        blockers: [],
        countdown: {
          active: false,
          daysRemaining: 0,
          phase: "NORMAL",
        },
        archived: true,
      } as ReadinessResponse);
    }

    const thresholdCents = get1099Threshold(year);

    // Calculate date range for the year
    const yearStart = new Date(year, 0, 1); // January 1
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // December 31

    // Get all PAID transfers for the year
    const transfers = await prisma.payoutTransfer.findMany({
      where: {
        status: PayoutTransferStatus.PAID,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            stripePayoutsEnabled: true,
          },
        },
      },
    });

    // Group by cleaner and sum amounts
    const cleanerTotals = new Map<
      string,
      {
        cleanerId: string;
        cleanerName: string | null;
        cleanerEmail: string;
        totalAmountCents: number;
        stripePayoutsEnabled: boolean;
      }
    >();

    for (const transfer of transfers) {
      const existing = cleanerTotals.get(transfer.cleanerId);
      if (existing) {
        existing.totalAmountCents += transfer.amountCents;
      } else {
        cleanerTotals.set(transfer.cleanerId, {
          cleanerId: transfer.cleanerId,
          cleanerName: transfer.cleaner.name,
          cleanerEmail: transfer.cleaner.email,
          totalAmountCents: transfer.amountCents,
          stripePayoutsEnabled: transfer.cleaner.stripePayoutsEnabled,
        });
      }
    }

    // Filter cleaners who meet threshold
    const eligibleCleanerIds = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => cleaner.cleanerId);

    if (eligibleCleanerIds.length === 0) {
      return NextResponse.json({
        success: true,
        year,
        threshold: thresholdCents / 100,
        overallScore: 0,
        eligibleCleanersCount: 0,
        cleaners: [],
        blockers: [],
      } as ReadinessResponse);
    }

    // Fetch tax profiles for eligible cleaners
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
      },
      select: {
        cleanerId: true,
        status: true,
        addressLine1: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
      },
    });

    const taxProfileMap = new Map(
      taxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    // Check which cleaners have statements
    const cleanersWithStatements = await prisma.payoutTransfer.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
        status: PayoutTransferStatus.PAID,
      },
      select: {
        cleanerId: true,
      },
      distinct: ["cleanerId"],
    });

    const cleanersWithStatementsSet = new Set(
      cleanersWithStatements.map((t) => t.cleanerId)
    );

    // Calculate readiness for each eligible cleaner
    const cleaners: CleanerReadiness[] = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);

        const w9Verified = taxProfile?.status === TaxProfileStatus.VERIFIED;
        const addressComplete =
          !!taxProfile?.addressLine1 &&
          !!taxProfile?.city &&
          !!taxProfile?.state &&
          !!taxProfile?.zipCode;
        const stripePayoutsEnabled = cleaner.stripePayoutsEnabled;
        const hasStatements = cleanersWithStatementsSet.has(cleaner.cleanerId);

        const score = calculateCleanerScore({
          w9Verified,
          addressComplete,
          stripePayoutsEnabled,
          hasStatements,
        });

        const blockerType = getBlockerType({
          w9Verified,
          addressComplete,
          stripePayoutsEnabled,
          hasStatements,
        });

        return {
          cleanerId: cleaner.cleanerId,
          cleanerName: cleaner.cleanerName,
          cleanerEmail: cleaner.cleanerEmail,
          score,
          w9Verified,
          addressComplete,
          stripePayoutsEnabled,
          hasStatements,
          blockerType,
        };
      });

    // Calculate overall score (average)
    const overallScore =
      cleaners.length > 0
        ? cleaners.reduce((sum, c) => sum + c.score, 0) / cleaners.length
        : 0;

    // Calculate blockers
    const blockerCounts = new Map<string, { count: number; cleanerIds: string[] }>();

    for (const cleaner of cleaners) {
      if (cleaner.blockerType) {
        const existing = blockerCounts.get(cleaner.blockerType);
        if (existing) {
          existing.count++;
          existing.cleanerIds.push(cleaner.cleanerId);
        } else {
          blockerCounts.set(cleaner.blockerType, {
            count: 1,
            cleanerIds: [cleaner.cleanerId],
          });
        }
      }
    }

    const blockerLabels: Record<string, string> = {
      W9_NOT_VERIFIED: "W-9 Not Verified",
      ADDRESS_INCOMPLETE: "Address Incomplete",
      STRIPE_PAYOUTS_DISABLED: "Stripe Payouts Disabled",
      NO_STATEMENTS: "No Statements",
    };

    const blockers = Array.from(blockerCounts.entries())
      .map(([type, data]) => ({
        type,
        label: blockerLabels[type] || type,
        count: data.count,
        cleanerIds: data.cleanerIds,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Phase 3H.7: Jan 31 Countdown Mode
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = January, 11 = December
    const isJanuary = currentMonth === 0;

    let countdown: {
      active: boolean;
      daysRemaining: number;
      phase: "NORMAL" | "WARNING" | "CRITICAL";
    } | undefined;

    if (isJanuary) {
      // Calculate days remaining until Jan 31 end-of-day
      const jan31End = new Date(year, 0, 31, 23, 59, 59, 999);
      const daysRemaining = Math.max(
        0,
        Math.ceil((jan31End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Determine phase based on days remaining
      let phase: "NORMAL" | "WARNING" | "CRITICAL";
      if (daysRemaining <= 7) {
        phase = "CRITICAL";
      } else if (daysRemaining <= 14) {
        phase = "WARNING";
      } else {
        phase = "NORMAL";
      }

      countdown = {
        active: true,
        daysRemaining,
        phase,
      };
    } else {
      countdown = {
        active: false,
        daysRemaining: 0,
        phase: "NORMAL",
      };
    }

    return NextResponse.json({
      success: true,
      year,
      threshold: thresholdCents / 100,
      overallScore: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
      eligibleCleanersCount: cleaners.length,
      cleaners,
      blockers,
      countdown,
    } as ReadinessResponse);
  } catch (error: any) {
    console.error("[ADMIN_1099_READINESS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch readiness score",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

