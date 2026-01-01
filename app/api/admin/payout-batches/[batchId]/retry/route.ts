/**
 * Phase 3B Step 2: Retry Failed Payout Transfers API
 * 
 * POST /api/admin/payout-batches/[batchId]/retry
 * 
 * Retries FAILED PayoutTransfer rows by calling processApprovedPayoutBatch.
 * Does NOT recalculate eligibility, unlock ledger rows, or change amounts.
 * Simply retries the Stripe transfer for failed transfers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { processApprovedPayoutBatch } from "@/lib/payout/stripePayoutWorker";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { batchId } = params;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "batchId is required" },
        { status: 400 }
      );
    }

    // Verify batch exists
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Check for FAILED transfers
    const failedTransfers = await prisma.payoutTransfer.findMany({
      where: {
        batchId,
        status: PayoutTransferStatus.FAILED,
      },
      select: {
        id: true,
        cleanerId: true,
        amountCents: true,
        failureReason: true,
      },
    });

    if (failedTransfers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No failed transfers to retry",
        retry: {
          failedCount: 0,
          retried: 0,
        },
      });
    }

    // Retry failed transfers by calling processApprovedPayoutBatch
    // This will process both PENDING and FAILED transfers, but we only have FAILED
    // The worker will retry them without recalculating eligibility or unlocking ledger
    const result = await processApprovedPayoutBatch(batchId, {
      limit: failedTransfers.length, // Process all failed transfers
    });

    // Filter results to only show retried transfers (those that were FAILED)
    const retriedResults = result.results.filter((r) =>
      failedTransfers.some((ft) => ft.id === r.transferId)
    );

    return NextResponse.json({
      success: true,
      batch: {
        id: result.batchId,
        status: result.batchStatus,
        isComplete: result.isComplete,
      },
      retry: {
        failedCount: failedTransfers.length,
        retried: retriedResults.length,
        succeeded: retriedResults.filter((r) => r.status === "succeeded").length,
        failed: retriedResults.filter((r) => r.status === "failed").length,
        skipped: retriedResults.filter((r) => r.status === "skipped").length,
      },
      results: retriedResults.map((r) => {
        const transfer = failedTransfers.find((ft) => ft.id === r.transferId);
        return {
          transferId: r.transferId,
          cleanerId: r.cleanerId,
          amountCents: transfer?.amountCents,
          previousFailureReason: transfer?.failureReason,
          status: r.status,
          error: r.error,
          stripePayoutId: r.stripePayoutId,
        };
      }),
      message: `Retried ${retriedResults.length} failed transfer(s). ${retriedResults.filter((r) => r.status === "succeeded").length} succeeded, ${retriedResults.filter((r) => r.status === "failed").length} failed.`,
    });
  } catch (error: any) {
    console.error("[RETRY_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retry payout batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

