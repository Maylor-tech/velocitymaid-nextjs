/**
 * Phase 3B: Payout Batch Creation Service
 * 
 * Creates payout batch drafts using transaction-aware queries.
 * All operations happen within a single database transaction.
 * 
 * NO STRIPE CALLS - This is Step 1 only.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { evaluatePayoutEligibility } from "./eligibilityRules";
import type { PayoutEligibilityData } from "./eligibilityTypes";
import { PayoutBatchStatus, PayoutTransferStatus } from "@prisma/client";

export interface PayoutBatchDraftResult {
  batchId: string;
  periodStart: Date;
  periodEnd: Date;
  totalCleaners: number;
  eligibleCleaners: number;
  skippedCleaners: number;
  totalAmountCents: number;
  transfers: Array<{
    transferId: string;
    cleanerId: string;
    amountCents: number;
    lockedEntriesCount: number;
  }>;
  skipped: Array<{
    cleanerId: string;
    reason: string;
  }>;
}

/**
 * Get payout eligibility data for a cleaner using transaction-aware queries
 * 
 * This is a transaction-aware version of getPayoutEligibilityData
 */
async function getPayoutEligibilityDataTx(
  tx: Prisma.TransactionClient,
  cleanerId: string
): Promise<PayoutEligibilityData> {
  // Get cleaner with basic info and Stripe Connect fields
  const cleaner = await tx.user.findUnique({
    where: { id: cleanerId },
    select: {
      id: true,
      isActive: true,
      isSuspended: true,
      stripeAccountId: true,
      stripePayoutsEnabled: true,
    },
  });

  if (!cleaner) {
    throw new Error(`Cleaner not found: ${cleanerId}`);
  }

  // Count completed jobs (status = "COMPLETED" or "completed" and paymentStatus = "PAID")
  const completedJobsCount = await tx.job.count({
    where: {
      assignedCleanerId: cleanerId,
      status: {
        in: ["COMPLETED", "completed", "Completed"],
      },
      paymentStatus: "PAID",
      completedAt: { not: null },
    },
  });

  // Check for open disputes/compliance issues
  const unresolvedComplianceIssues = await tx.complianceIssue.count({
    where: {
      cleanerId: cleanerId,
      status: { in: ["OPEN", "ESCALATED"] },
    },
  });

  const hasOpenDisputes = unresolvedComplianceIssues > 0;

  // Calculate eligible amount from CleanerBalanceLedger
  // Eligible = CREDIT entries with POSTED status and no payoutTransferId
  const eligibleLedgerEntries = await tx.cleanerBalanceLedger.findMany({
    where: {
      cleanerId: cleanerId,
      type: "CREDIT",
      status: "POSTED",
      payoutTransferId: null, // Not yet paid out
    },
    select: {
      amountCents: true,
    },
  });

  const eligibleAmountCents = eligibleLedgerEntries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0
  );

  // Phase 3C: Use actual Stripe Connect fields
  const stripeAccountId = cleaner.stripeAccountId;
  // stripeVerified = stripePayoutsEnabled === true
  const stripeAccountVerified = cleaner.stripePayoutsEnabled === true;

  // Admin hold is separate from compliance issues
  const adminHold = cleaner.isSuspended || false;

  return {
    cleanerId,
    completedJobsCount,
    hasOpenDisputes,
    stripeAccountId,
    stripeAccountVerified,
    adminHold,
    eligibleAmountCents,
  };
}

/**
 * Create a payout batch draft for eligible cleaners
 * 
 * All operations happen within a single database transaction:
 * 1. Create PayoutBatch (DRAFT)
 * 2. Iterate cleaners
 * 3. Compute Phase 3A eligibility using tx-aware queries
 * 4. Create PayoutTransfer for eligible cleaners
 * 5. Lock CleanerBalanceLedger rows by setting payoutTransferId
 * 6. Verify sum of locked ledger equals transfer amount
 * 7. Compute totals
 * 8. Return summary
 * 
 * @param periodStart - Start of payout period
 * @param periodEnd - End of payout period
 * @param createdByAdminId - Admin user who created the batch (optional)
 * @returns Batch creation result
 */
export async function createPayoutBatchDraft(
  periodStart: Date,
  periodEnd: Date,
  createdByAdminId?: string
): Promise<PayoutBatchDraftResult> {
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Create PayoutBatch (DRAFT)
    const batch = await tx.payoutBatch.create({
      data: {
        periodStart,
        periodEnd,
        status: PayoutBatchStatus.DRAFT,
        createdByAdminId,
        totalAmountCents: 0, // Will be computed after transfers
      },
    });

    // Step 2: Get all active cleaners
    const allCleaners = await tx.user.findMany({
      where: {
        role: "CLEANER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Step 3: Iterate cleaners and compute eligibility using tx-aware queries
    const transfers: Array<{
      transferId: string;
      cleanerId: string;
      amountCents: number;
      lockedEntriesCount: number;
    }> = [];

    const skipped: Array<{
      cleanerId: string;
      reason: string;
    }> = [];

    let totalAmountCents = 0;

    for (const cleaner of allCleaners) {
      try {
        // Step 3a: Compute Phase 3A eligibility using tx-aware queries
        const eligibilityData = await getPayoutEligibilityDataTx(
          tx,
          cleaner.id
        );
        const eligibilityResult = evaluatePayoutEligibility(eligibilityData);

        // Skip if not eligible or no eligible amount
        if (!eligibilityResult.isEligible || eligibilityData.eligibleAmountCents <= 0) {
          skipped.push({
            cleanerId: cleaner.id,
            reason:
              eligibilityResult.blockers
                .map((b) => b.message)
                .join("; ") || "Not eligible for payout",
          });
          continue;
        }

        // Step 4: Create PayoutTransfer
        const transfer = await tx.payoutTransfer.create({
          data: {
            batchId: batch.id,
            cleanerId: cleaner.id,
            amountCents: eligibilityData.eligibleAmountCents,
            currency: "USD",
            status: PayoutTransferStatus.PENDING,
          },
        });

        // Step 5: Lock CleanerBalanceLedger rows by setting payoutTransferId
        // Find eligible ledger entries (CREDIT, POSTED, not yet locked)
        const eligibleEntries = await tx.cleanerBalanceLedger.findMany({
          where: {
            cleanerId: cleaner.id,
            type: "CREDIT",
            status: "POSTED",
            payoutTransferId: null, // Not yet locked
          },
          orderBy: {
            createdAt: "asc", // Lock oldest first (FIFO)
          },
        });

        // Select entries to lock (up to eligible amount)
        let entriesToLock: typeof eligibleEntries = [];
        let runningTotal = 0;

        for (const entry of eligibleEntries) {
          if (runningTotal + entry.amountCents > eligibilityData.eligibleAmountCents) {
            break; // Don't exceed eligible amount
          }
          entriesToLock.push(entry);
          runningTotal += entry.amountCents;
        }

        if (entriesToLock.length === 0) {
          // Rollback: delete transfer if no entries to lock
          await tx.payoutTransfer.delete({
            where: { id: transfer.id },
          });
          skipped.push({
            cleanerId: cleaner.id,
            reason: "No eligible ledger entries found",
          });
          continue;
        }

        // Lock entries atomically within transaction
        const updateResult = await tx.cleanerBalanceLedger.updateMany({
          where: {
            id: { in: entriesToLock.map((e) => e.id) },
            payoutTransferId: null, // Double-check: only lock if still unlocked
          },
          data: {
            payoutTransferId: transfer.id,
          },
        });

        // Verify we actually locked the entries
        if (updateResult.count !== entriesToLock.length) {
          throw new Error(
            `Failed to lock all ledger entries for cleaner ${cleaner.id}. Expected ${entriesToLock.length}, locked ${updateResult.count}`
          );
        }

        // Step 6: Verify sum of locked ledger equals transfer amount
        const lockedSum = entriesToLock.reduce(
          (sum, entry) => sum + entry.amountCents,
          0
        );

        if (lockedSum !== eligibilityData.eligibleAmountCents) {
          throw new Error(
            `Ledger lock mismatch for cleaner ${cleaner.id}: expected ${eligibilityData.eligibleAmountCents}, locked ${lockedSum}`
          );
        }

        // Step 7: Add to transfers list
        transfers.push({
          transferId: transfer.id,
          cleanerId: cleaner.id,
          amountCents: eligibilityData.eligibleAmountCents,
          lockedEntriesCount: entriesToLock.length,
        });

        totalAmountCents += eligibilityData.eligibleAmountCents;
      } catch (error: any) {
        // If error during processing, skip this cleaner
        skipped.push({
          cleanerId: cleaner.id,
          reason: error.message || "Error processing cleaner",
        });
        // Continue with next cleaner (transaction will rollback if critical)
      }
    }

    // Step 7: Update batch with computed total
    await tx.payoutBatch.update({
      where: { id: batch.id },
      data: {
        totalAmountCents,
      },
    });

    // Step 8: Return summary
    return {
      batchId: batch.id,
      periodStart,
      periodEnd,
      totalCleaners: allCleaners.length,
      eligibleCleaners: transfers.length,
      skippedCleaners: skipped.length,
      totalAmountCents,
      transfers,
      skipped,
    };
  });

  return result;
}

