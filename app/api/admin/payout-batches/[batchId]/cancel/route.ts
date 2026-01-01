/**
 * Phase 3B: Cancel Payout Batch API
 * 
 * POST /api/admin/payout-batches/[batchId]/cancel
 * 
 * Cancels ONLY DRAFT payout batches by:
 * - Unlocking CleanerBalanceLedger rows (set payoutTransferId = null)
 * - Deleting PayoutTransfer rows
 * - Deleting PayoutBatch
 * 
 * Rejects cancellation for any non-DRAFT status.
 * No Stripe calls.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutBatchStatus } from "@prisma/client";

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

    // Execute cancellation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Verify batch exists and is DRAFT
      const batch = await tx.payoutBatch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              transfers: true,
            },
          },
        },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      if (batch.status !== PayoutBatchStatus.DRAFT) {
        throw new Error(
          `Cannot cancel batch. Only DRAFT batches can be canceled. Current status: ${batch.status}`
        );
      }

      // Step 2: Get all transfers in this batch
      const transfers = await tx.payoutTransfer.findMany({
        where: { batchId },
        select: {
          id: true,
        },
      });

      // Step 3: Unlock CleanerBalanceLedger rows by setting payoutTransferId = null
      const transferIds = transfers.map((t) => t.id);
      let unlockedLedgerEntries = 0;

      if (transferIds.length > 0) {
        const unlockResult = await tx.cleanerBalanceLedger.updateMany({
          where: {
            payoutTransferId: {
              in: transferIds,
            },
          },
          data: {
            payoutTransferId: null,
          },
        });

        unlockedLedgerEntries = unlockResult.count;

        // Step 4: Delete PayoutTransfer rows
        // Note: This will cascade delete related records if any
        await tx.payoutTransfer.deleteMany({
          where: {
            batchId,
          },
        });
      }

      // Step 5: Delete the PayoutBatch
      await tx.payoutBatch.delete({
        where: { id: batchId },
      });

      return {
        batchId,
        unlockedLedgerEntries,
        deletedTransfers: transfers.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Batch canceled successfully. Ledger entries unlocked and all records deleted.",
      canceled: {
        batchId: result.batchId,
        deletedTransfers: result.deletedTransfers,
        unlockedLedgerEntries: result.unlockedLedgerEntries,
      },
    });
  } catch (error: any) {
    console.error("[CANCEL_PAYOUT_BATCH] Error:", error);

    // Handle specific error cases
    if (error.message?.includes("Cannot cancel batch")) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes("Batch not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to cancel payout batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

