/**
 * Phase 3H.11: Auto-Archive Tax Year Cron Job
 * 
 * POST /api/cron/archive-tax-year
 * 
 * Runs daily at 12:05 AM (scheduled in vercel.json)
 * Archives the previous tax year if:
 * - Today >= Feb 1
 * - Tax year not already archived
 * 
 * Creates TaxYearArchive record with snapshot of readiness data
 * 
 * Security: Protected by CRON_SECRET header
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  return year === 2025 ? 600100 : 2000100;
}

/**
 * Calculate readiness score and summary for a tax year
 */
async function get1099Readiness(year: number): Promise<{
  overallScore: number;
  status: "READY" | "AT_RISK" | "NOT_READY";
  summary: {
    eligibleCleaners: number;
    verifiedW9: number;
    addressComplete: number;
    aboveThreshold: number;
    blockingCount: number;
    topBlockers: Array<{ type: string; count: number }>;
  };
}> {
  const thresholdCents = get1099Threshold(year);

  // Calculate date range for the year
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

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
        totalAmountCents: transfer.amountCents,
        stripePayoutsEnabled: transfer.cleaner.stripePayoutsEnabled,
      });
    }
  }

  // Filter cleaners who meet threshold
  const eligibleCleanerIds = Array.from(cleanerTotals.values())
    .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
    .map((cleaner) => cleaner.cleanerId);

  // Fetch tax profiles
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
  const cleaners = Array.from(cleanerTotals.values())
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

      let score = 0;
      if (w9Verified) score += 60;
      if (addressComplete) score += 20;
      if (stripePayoutsEnabled) score += 10;
      if (hasStatements) score += 10;

      const blockerType = !w9Verified
        ? "W9_NOT_VERIFIED"
        : !addressComplete
        ? "ADDRESS_INCOMPLETE"
        : !stripePayoutsEnabled
        ? "STRIPE_PAYOUTS_DISABLED"
        : !hasStatements
        ? "NO_STATEMENTS"
        : null;

      return {
        cleanerId: cleaner.cleanerId,
        score,
        w9Verified,
        addressComplete,
        blockerType,
      };
    });

  // Calculate overall score
  const overallScore =
    cleaners.length > 0
      ? cleaners.reduce((sum, c) => sum + c.score, 0) / cleaners.length
      : 0;

  // Calculate blockers
  const blockerCounts = new Map<string, number>();

  for (const cleaner of cleaners) {
    if (cleaner.blockerType) {
      blockerCounts.set(
        cleaner.blockerType,
        (blockerCounts.get(cleaner.blockerType) || 0) + 1
      );
    }
  }

  const blockerLabels: Record<string, string> = {
    W9_NOT_VERIFIED: "W-9 Not Verified",
    ADDRESS_INCOMPLETE: "Address Incomplete",
    STRIPE_PAYOUTS_DISABLED: "Stripe Payouts Disabled",
    NO_STATEMENTS: "No Statements",
  };

  const topBlockers = Array.from(blockerCounts.entries())
    .map(([type, count]) => ({
      type,
      label: blockerLabels[type] || type,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Determine status
  let status: "READY" | "AT_RISK" | "NOT_READY";
  if (overallScore >= 90) {
    status = "READY";
  } else if (overallScore >= 70) {
    status = "AT_RISK";
  } else {
    status = "NOT_READY";
  }

  // Build summary
  const verifiedW9 = cleaners.filter((c) => c.w9Verified).length;
  const addressComplete = cleaners.filter((c) => c.addressComplete).length;
  const blockingCount = cleaners.filter((c) => c.blockerType !== null).length;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    status,
    summary: {
      eligibleCleaners: cleaners.length,
      verifiedW9,
      addressComplete,
      aboveThreshold: cleaners.length,
      blockingCount,
      topBlockers: topBlockers.map((b) => ({
        type: b.type,
        count: b.count,
      })),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const secret = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON_ARCHIVE_TAX_YEAR] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (secret !== cronSecret) {
      console.warn("[CRON_ARCHIVE_TAX_YEAR] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1; // Archive previous tax year
    const feb1 = new Date(currentYear, 1, 1, 0, 5, 0); // Feb 1, 00:05 AM

    // Only archive if today >= Feb 1
    if (now < feb1) {
      console.log(
        `[CRON_ARCHIVE_TAX_YEAR] Skipping - before Feb 1 (current: ${now.toISOString()}, feb1: ${feb1.toISOString()})`
      );
      return NextResponse.json({
        ok: true,
        skipped: "Before Feb 1",
        currentDate: now.toISOString(),
        feb1Date: feb1.toISOString(),
      });
    }

    // Check if already archived
    const existing = await prisma.taxYearArchive.findUnique({
      where: { year: previousYear },
    });

    if (existing) {
      console.log(
        `[CRON_ARCHIVE_TAX_YEAR] Skipping - year ${previousYear} already archived`
      );
      return NextResponse.json({
        ok: true,
        skipped: "Already archived",
        archivedYear: previousYear,
        archivedAt: existing.archivedAt.toISOString(),
      });
    }

    console.log(
      `[CRON_ARCHIVE_TAX_YEAR] Archiving tax year ${previousYear}`
    );

    // Get readiness data for the year
    const readiness = await get1099Readiness(previousYear);

    // Create archive record
    await prisma.taxYearArchive.create({
      data: {
        year: previousYear,
        archivedAt: new Date(),
        archivedBy: "SYSTEM",
        readinessScore: readiness.overallScore,
        status: readiness.status,
        summaryJson: readiness.summary,
      },
    });

    console.log(
      `[CRON_ARCHIVE_TAX_YEAR] Successfully archived year ${previousYear} with score ${readiness.overallScore}`
    );

    return NextResponse.json({
      ok: true,
      archivedYear: previousYear,
      readinessScore: readiness.overallScore,
      status: readiness.status,
      summary: readiness.summary,
    });
  } catch (error: any) {
    console.error("[CRON_ARCHIVE_TAX_YEAR] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to archive tax year",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health checks
 */
export async function GET() {
  return NextResponse.json({
    service: "archive-tax-year-cron",
    status: "ok",
    message: "Tax year archive cron endpoint is active",
    note: "Runs daily at 12:05 AM, archives previous year after Feb 1",
  });
}


