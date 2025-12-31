/**
 * Phase 3B Step 2: Stripe Payout Worker
 * 
 * Processes approved payout batches by executing Stripe transfers.
 * 
 * Flow:
 * 1. Gate on batch status (APPROVED/PROCESSING)
 * 2. Set batch to PROCESSING
 * 3. Process PayoutTransfer rows (PENDING/FAILED → PROCESSING)
 * 4. Verify cleaner has stripeAccountId
 * 5. Verify locked ledger sum equals transfer amount
 * 6. Call stripe.transfers.create with idempotency key
 * 7. Mark transfer PAID with stripePayoutId on success
 * 8. Mark FAILED with failureReason on error
 * 9. Complete batch when no remaining transfers
 * 
 * NO ELIGIBILITY RECALCULATION - Uses existing locked ledger entries
 */

import { prisma } from "@/lib/prisma";
import { PayoutBatchStatus, PayoutTransferStatus } from "@prisma/client";
import Stripe from "stripe";
import { sendPayoutConfirmationEmail } from "./payoutConfirmationEmail";

/**
 * Get Stripe client (lazy initialization)
 */
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
}

export interface ProcessPayoutBatchOptions {
  limit?: number; // Max number of transfers to process in one pass
}

export interface ProcessPayoutBatchResult {
  batchId: string;
  batchStatus: PayoutBatchStatus;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: Array<{
    transferId: string;
    cleanerId: string;
    status: "succeeded" | "failed" | "skipped";
    error?: string;
    stripePayoutId?: string;
  }>;
  isComplete: boolean;
}

/**
 * Process approved payout batch by executing Stripe transfers
 * 
 * @param batchId - The batch ID to process
 * @param options - Processing options (limit)
 * @returns Processing result
 */
export async function processApprovedPayoutBatch(
  batchId: string,
  options: ProcessPayoutBatchOptions = {}
): Promise<ProcessPayoutBatchResult> {
  const limit = options.limit || 50; // Default: process 50 transfers per pass

  // Step 1: Gate on batch status (APPROVED/PROCESSING)
  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!batch) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  if (
    batch.status !== PayoutBatchStatus.APPROVED &&
    batch.status !== PayoutBatchStatus.PROCESSING
  ) {
    throw new Error(
      `Batch is not in APPROVED or PROCESSING status. Current status: ${batch.status}`
    );
  }

  // Step 2: Set batch to PROCESSING (if not already)
  if (batch.status === PayoutBatchStatus.APPROVED) {
    await prisma.payoutBatch.update({
      where: { id: batchId },
      data: { status: PayoutBatchStatus.PROCESSING },
    });
  }

  // Step 3: Get transfers in PENDING or FAILED status (retry failed)
  const transfers = await prisma.payoutTransfer.findMany({
    where: {
      batchId,
      status: {
        in: [PayoutTransferStatus.PENDING, PayoutTransferStatus.FAILED],
      },
    },
    take: limit,
    orderBy: {
      createdAt: "asc", // Process oldest first
    },
    include: {
      cleaner: {
        select: {
          id: true,
          email: true,
          name: true,
          stripeAccountId: true, // Added for Phase 3C
          stripePayoutsEnabled: true, // Added for Phase 3C
        },
      },
      batch: {
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  if (transfers.length === 0) {
    // Step 9: Complete batch when no remaining transfers
    const remainingCount = await prisma.payoutTransfer.count({
      where: {
        batchId,
        status: {
          in: [PayoutTransferStatus.PENDING, PayoutTransferStatus.FAILED],
        },
      },
    });

    if (remainingCount === 0) {
      // All transfers are PAID or FAILED, mark batch as COMPLETED
      await prisma.payoutBatch.update({
        where: { id: batchId },
        data: { status: PayoutBatchStatus.COMPLETED },
      });
    }

    return {
      batchId,
      batchStatus: remainingCount === 0 ? PayoutBatchStatus.COMPLETED : PayoutBatchStatus.PROCESSING,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      results: [],
      isComplete: remainingCount === 0,
    };
  }

  const stripe = getStripe();
  const results: ProcessPayoutBatchResult["results"] = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // Process each transfer
  for (const transfer of transfers) {
    try {
      // Step 3: Move transfer to PROCESSING
      await prisma.payoutTransfer.update({
        where: { id: transfer.id },
        data: { status: PayoutTransferStatus.PROCESSING },
      });

      // Step 4: Verify cleaner has stripeAccountId and stripeVerified (stripePayoutsEnabled === true)
      const cleanerWithStripe = await prisma.user.findUnique({
        where: { id: transfer.cleanerId },
        select: {
          id: true,
          stripeAccountId: true,
          stripePayoutsEnabled: true,
        },
      });

      if (!cleanerWithStripe?.stripeAccountId) {
        await prisma.payoutTransfer.update({
          where: { id: transfer.id },
          data: {
            status: PayoutTransferStatus.FAILED,
            failureReason: "Cleaner does not have a Stripe account connected",
          },
        });
        results.push({
          transferId: transfer.id,
          cleanerId: transfer.cleanerId,
          status: "skipped",
          error: "Cleaner does not have a Stripe account connected",
        });
        skipped++;
        continue;
      }

      // Phase 3C: stripeVerified = stripePayoutsEnabled === true
      const stripeVerified = cleanerWithStripe.stripePayoutsEnabled === true;
      if (!stripeVerified) {
        await prisma.payoutTransfer.update({
          where: { id: transfer.id },
          data: {
            status: PayoutTransferStatus.FAILED,
            failureReason: "Cleaner Stripe account is not verified (payouts not enabled)",
          },
        });
        results.push({
          transferId: transfer.id,
          cleanerId: transfer.cleanerId,
          status: "skipped",
          error: "Cleaner Stripe account is not verified",
        });
        skipped++;
        continue;
      }

      const stripeAccountId = cleanerWithStripe.stripeAccountId;

      // Step 5: Verify locked ledger sum equals transfer amount
      const lockedLedgerEntries = await prisma.cleanerBalanceLedger.findMany({
        where: {
          payoutTransferId: transfer.id,
        },
        select: {
          amountCents: true,
        },
      });

      const lockedSum = lockedLedgerEntries.reduce(
        (sum, entry) => sum + entry.amountCents,
        0
      );

      if (lockedSum !== transfer.amountCents) {
        throw new Error(
          `Ledger lock mismatch: expected ${transfer.amountCents}, locked ${lockedSum}`
        );
      }

      // Step 6: Call stripe.transfers.create with idempotency key
      // Idempotency key ensures we don't create duplicate transfers on retry
      const idempotencyKey = `payout_transfer_${transfer.id}`;

      try {
        const stripeTransfer = await stripe.transfers.create(
          {
            amount: transfer.amountCents,
            currency: transfer.currency.toLowerCase(),
            destination: stripeAccountId,
            metadata: {
              transferId: transfer.id,
              batchId: batchId,
              cleanerId: transfer.cleanerId,
            },
          },
          {
            idempotencyKey,
          }
        );

        // Step 7: Mark transfer PAID with stripePayoutId on success
        const updatedTransfer = await prisma.payoutTransfer.update({
          where: { id: transfer.id },
          data: {
            status: PayoutTransferStatus.PAID,
            stripePayoutId: stripeTransfer.id,
          },
          include: {
            cleaner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            batch: {
              select: {
                id: true,
                periodStart: true,
                periodEnd: true,
              },
            },
          },
        });

        // Phase 3G: Send payout confirmation email (non-blocking)
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        
        sendPayoutConfirmationEmail(updatedTransfer, baseUrl).catch((emailError) => {
          // Email failure doesn't affect payout success
          console.error(
            `[PAYOUT_WORKER] Failed to send confirmation email for transfer ${transfer.id}:`,
            emailError
          );
        });

        results.push({
          transferId: transfer.id,
          cleanerId: transfer.cleanerId,
          status: "succeeded",
          stripePayoutId: stripeTransfer.id,
        });

        succeeded++;
      } catch (stripeError: any) {
        // Step 8: Mark FAILED with failureReason on error
        const errorMessage =
          stripeError.message || "Stripe transfer failed";
        const errorCode = stripeError.code || "unknown_error";

        await prisma.payoutTransfer.update({
          where: { id: transfer.id },
          data: {
            status: PayoutTransferStatus.FAILED,
            failureReason: `${errorCode}: ${errorMessage}`,
          },
        });

        results.push({
          transferId: transfer.id,
          cleanerId: transfer.cleanerId,
          status: "failed",
          error: errorMessage,
        });

        failed++;
      }
    } catch (error: any) {
      // Handle any other errors
      const errorMessage = error.message || "Unknown error processing transfer";

      await prisma.payoutTransfer.update({
        where: { id: transfer.id },
        data: {
          status: PayoutTransferStatus.FAILED,
          failureReason: errorMessage,
        },
      });

      results.push({
        transferId: transfer.id,
        cleanerId: transfer.cleanerId,
        status: "failed",
        error: errorMessage,
      });

      failed++;
    }
  }

  // Step 9: Check if batch is complete (no remaining PENDING/FAILED transfers)
  const remainingCount = await prisma.payoutTransfer.count({
    where: {
      batchId,
      status: {
        in: [PayoutTransferStatus.PENDING, PayoutTransferStatus.FAILED],
      },
    },
  });

  const isComplete = remainingCount === 0;

  if (isComplete) {
    // All transfers processed, mark batch as COMPLETED
    await prisma.payoutBatch.update({
      where: { id: batchId },
      data: { status: PayoutBatchStatus.COMPLETED },
    });
  }

  return {
    batchId,
    batchStatus: isComplete
      ? PayoutBatchStatus.COMPLETED
      : PayoutBatchStatus.PROCESSING,
    processed: transfers.length,
    succeeded,
    failed,
    skipped,
    results,
    isComplete,
  };
}

