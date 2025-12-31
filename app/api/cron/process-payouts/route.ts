/**
 * Phase 3E: Automated Payout Processing Cron Job
 * 
 * POST /api/cron/process-payouts
 * 
 * Core Principle: Automation may execute payouts, but automation must never
 * decide amounts or eligibility. All decisions are frozen by Phase 3A (eligibility)
 * and Phase 3B (batch creation + approval). Automation only executes what's
 * already approved.
 * 
 * Security: Protected by CRON_SECRET header
 * Schedule: Configured in vercel.json (default: every 10 minutes)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processApprovedPayoutBatch } from "@/lib/payout/stripePayoutWorker";
import { PayoutBatchStatus, PayoutTransferStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const secret = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON_PROCESS_PAYOUTS] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (secret !== cronSecret) {
      console.warn("[CRON_PROCESS_PAYOUTS] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Dry-run mode (skip Stripe calls, log what would happen)
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry") === "true";

    if (dryRun) {
      console.log("[CRON_PROCESS_PAYOUTS] DRY RUN MODE - No Stripe calls will be made");
    }

    // 1️⃣ Find APPROVED batches (automation never creates or approves)
    const batches = await prisma.payoutBatch.findMany({
      where: {
        status: PayoutBatchStatus.APPROVED, // Only process approved batches
      },
      orderBy: {
        createdAt: "asc", // Process oldest first
      },
      take: 3, // Safety limit: process max 3 batches per run
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        totalAmountCents: true,
      },
    });

    if (batches.length === 0) {
      return NextResponse.json({
        ok: true,
        processedBatches: 0,
        message: "No approved batches to process",
        results: [],
      });
    }

    console.log(
      `[CRON_PROCESS_PAYOUTS] Found ${batches.length} approved batch(es) to process`
    );

    const results: Array<{
      batchId: string;
      success?: boolean;
      processed?: number;
      succeeded?: number;
      failed?: number;
      skipped?: number;
      isComplete?: boolean;
      error?: string;
    }> = [];

    // 2️⃣ Process each batch (automation only executes, never decides)
    for (const batch of batches) {
      try {
        if (dryRun) {
          // Dry-run: Just log what would happen
          const transferCount = await prisma.payoutTransfer.count({
            where: {
              batchId: batch.id,
              status: {
                in: [PayoutTransferStatus.PENDING, PayoutTransferStatus.FAILED],
              },
            },
          });

          results.push({
            batchId: batch.id,
            success: true,
            processed: transferCount,
          });

          console.log(
            `[CRON_PROCESS_PAYOUTS] [DRY RUN] Batch ${batch.id}: Would process ${transferCount} transfer(s)`
          );
        } else {
          // Real execution: Use existing worker (respects limits, idempotent)
          const result = await processApprovedPayoutBatch(batch.id, {
            limit: 50, // Process up to 50 transfers per batch per run
          });

          results.push({
            batchId: batch.id,
            success: true,
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
            isComplete: result.isComplete,
          });

          console.log(
            `[CRON_PROCESS_PAYOUTS] Batch ${batch.id}: Processed ${result.processed}, Succeeded ${result.succeeded}, Failed ${result.failed}, Complete: ${result.isComplete}`
          );
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Unknown error";
        results.push({
          batchId: batch.id,
          success: false,
          error: errorMessage,
        });

        console.error(
          `[CRON_PROCESS_PAYOUTS] Error processing batch ${batch.id}:`,
          errorMessage
        );
        // Continue with next batch (don't fail entire cron run)
      }
    }

    return NextResponse.json({
      ok: true,
      processedBatches: results.length,
      dryRun,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON_PROCESS_PAYOUTS] Fatal error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to process payouts",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Support GET for health checks (returns status without processing)
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;

  if (secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count approved batches (read-only check)
  const approvedCount = await prisma.payoutBatch.count({
    where: {
      status: PayoutBatchStatus.APPROVED,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Cron endpoint is active",
    approvedBatches: approvedCount,
    timestamp: new Date().toISOString(),
  });
}

