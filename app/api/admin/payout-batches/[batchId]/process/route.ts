/**
 * Phase 3B Step 2: Process Payout Batch API
 * 
 * POST /api/admin/payout-batches/[batchId]/process?limit=
 * 
 * Runs one pass of Stripe payout processing for an approved batch.
 * Processes transfers in PENDING/FAILED status up to the limit.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { processApprovedPayoutBatch } from "@/lib/payout/stripePayoutWorker";

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

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (limit !== undefined && (limit < 1 || limit > 100)) {
      return NextResponse.json(
        { success: false, error: "limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Process batch (one pass)
    const result = await processApprovedPayoutBatch(batchId, {
      limit,
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: result.batchId,
        status: result.batchStatus,
        isComplete: result.isComplete,
      },
      processing: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
      },
      results: result.results,
      message: result.isComplete
        ? "Batch processing complete. All transfers processed."
        : `Processed ${result.processed} transfer(s). ${result.succeeded} succeeded, ${result.failed} failed, ${result.skipped} skipped. Run again to process remaining transfers.`,
    });
  } catch (error: any) {
    console.error("[PROCESS_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process payout batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

