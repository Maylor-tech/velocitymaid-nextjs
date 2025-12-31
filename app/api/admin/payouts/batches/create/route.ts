/**
 * Phase 3B: Create Payout Batch API
 * 
 * POST /api/admin/payouts/batches/create
 * 
 * Creates a payout batch by:
 * - Snapshotting eligibility (Phase 3A)
 * - Creating PayoutBatch
 * - Creating PayoutTransfer rows
 * - Locking ledger entries
 * 
 * NO STRIPE CALLS - This is Step 1 only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { createPayoutBatch, getBatchDetails } from "@/lib/payout/batchCreation";

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { periodStart, periodEnd } = body;

    // Validate date range
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        {
          success: false,
          error: "periodStart and periodEnd are required (ISO date strings)",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use ISO date strings.",
        },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "periodStart must be before periodEnd",
        },
        { status: 400 }
      );
    }

    // Create batch (snapshots eligibility, creates transfers, locks ledger)
    const result = await createPayoutBatch(
      startDate,
      endDate,
      auth.userId
    );

    return NextResponse.json({
      success: true,
      batch: {
        id: result.batchId,
        periodStart: result.periodStart.toISOString(),
        periodEnd: result.periodEnd.toISOString(),
        totalAmountCents: result.totalAmountCents,
        totalAmountDollars: (result.totalAmountCents / 100).toFixed(2),
      },
      summary: {
        totalCleaners: result.totalCleaners,
        eligibleCleaners: result.eligibleCleaners,
        skippedCleaners: result.skipped.length,
      },
      transfers: result.transfers.map((t) => ({
        transferId: t.transferId,
        cleanerId: t.cleanerId,
        amountCents: t.amountCents,
        amountDollars: (t.amountCents / 100).toFixed(2),
        lockedEntriesCount: t.lockedEntriesCount,
      })),
      skipped: result.skipped,
      message: `Created payout batch with ${result.eligibleCleaners} eligible cleaner(s), total: $${(result.totalAmountCents / 100).toFixed(2)}`,
    });
  } catch (error: any) {
    console.error("[CREATE_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create payout batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payouts/batches/create?batchId=xxx
 * 
 * Get batch details including transfers and locked ledger entries
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          error: "batchId query parameter is required",
        },
        { status: 400 }
      );
    }

    const batch = await getBatchDetails(batchId);

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        periodStart: batch.periodStart.toISOString(),
        periodEnd: batch.periodEnd.toISOString(),
        status: batch.status,
        totalAmountCents: batch.totalAmountCents,
        totalAmountDollars: batch.totalAmountCents
          ? (batch.totalAmountCents / 100).toFixed(2)
          : "0.00",
        createdByAdminId: batch.createdByAdminId,
        createdAt: batch.createdAt.toISOString(),
      },
      transfers: batch.transfers.map((t) => ({
        id: t.id,
        cleanerId: t.cleanerId,
        cleaner: t.cleaner,
        amountCents: t.amountCents,
        amountDollars: (t.amountCents / 100).toFixed(2),
        status: t.status,
        stripePayoutId: t.stripePayoutId,
        failureReason: t.failureReason,
        lockedEntriesCount: t.ledgerEntries.length,
        lockedAmountCents: t.ledgerEntries.reduce(
          (sum, e) => sum + e.amountCents,
          0
        ),
        createdAt: t.createdAt.toISOString(),
      })),
      summary: {
        totalTransfers: batch.transfers.length,
        pendingTransfers: batch.transfers.filter(
          (t) => t.status === "PENDING"
        ).length,
        processingTransfers: batch.transfers.filter(
          (t) => t.status === "PROCESSING"
        ).length,
        paidTransfers: batch.transfers.filter((t) => t.status === "PAID")
          .length,
        failedTransfers: batch.transfers.filter((t) => t.status === "FAILED")
          .length,
      },
    });
  } catch (error: any) {
    console.error("[GET_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get batch details",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

