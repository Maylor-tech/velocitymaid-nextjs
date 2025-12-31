/**
 * Phase 3B: Payout Batch Creation Service
 * 
 * Creates payout batches by:
 * 1. Snapshotting eligibility (Phase 3A)
 * 2. Creating PayoutBatch
 * 3. Creating PayoutTransfer rows (one per eligible cleaner)
 * 4. Locking ledger entries
 * 
 * NO STRIPE CALLS - This is Step 1 only.
 */

import { prisma } from "@/lib/prisma";
import { getPayoutEligibility } from "./eligibilityService";
import { PayoutBatchStatus, PayoutTransferStatus } from "@prisma/client";

export interface BatchCreationResult {
  batchId: string;
  periodStart: Date;
  periodEnd: Date;
  totalCleaners: number;
  eligibleCleaners: number;
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
 * Create a payout batch for eligible cleaners
 * 
 * @param periodStart - Start of payout period
 * @param periodEnd - End of payout period
 * @param createdByAdminId - Admin user who created the batch (optional)
 * @returns Batch creation result
 */
export async function createPayoutBatch(
  periodStart: Date,
  periodEnd: Date,
  createdByAdminId?: string
): Promise<BatchCreationResult> {
  // Step 1: Get all active cleaners
  const allCleaners = await prisma.user.findMany({
    where: {
      role: "CLEANER",
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  // Step 2: Check eligibility for each cleaner (snapshot)
  const eligibilityResults = new Map<
    string,
    { isEligible: boolean; eligibleAmountCents: number; reason?: string }
  >();

  for (const cleaner of allCleaners) {
    try {
      const eligibility = await getPayoutEligibility(cleaner.id);
      eligibilityResults.set(cleaner.id, {
        isEligible: eligibility.isEligible,
        eligibleAmountCents: eligibility.eligibleAmountCents,
      });
    } catch (error: any) {
      eligibilityResults.set(cleaner.id, {
        isEligible: false,
        eligibleAmountCents: 0,
        reason: error.message || "Error checking eligibility",
      });
    }
  }

  // Step 3: Filter eligible cleaners
  const eligibleCleaners = Array.from(eligibilityResults.entries())
    .filter(([_, result]) => result.isEligible && result.eligibleAmountCents > 0)
    .map(([cleanerId, result]) => ({
      cleanerId,
      eligibleAmountCents: result.eligibleAmountCents,
    }));

  const skipped = Array.from(eligibilityResults.entries())
    .filter(([_, result]) => !result.isEligible || result.eligibleAmountCents <= 0)
    .map(([cleanerId, result]) => ({
      cleanerId,
      reason: result.reason || "Not eligible for payout",
    }));

  // Step 4: Create batch and transfers in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create PayoutBatch
    const batch = await tx.payoutBatch.create({
      data: {
        periodStart,
        periodEnd,
        status: PayoutBatchStatus.DRAFT,
        createdByAdminId,
        totalAmountCents: 0, // Will be computed after transfers
      },
    });

    // Create transfers and lock ledger entries
    const transfers: Array<{
      transferId: string;
      cleanerId: string;
      amountCents: number;
      lockedEntriesCount: number;
    }> = [];

    let totalAmountCents = 0;

    for (const cleaner of eligibleCleaners) {
      // Create PayoutTransfer
      const transfer = await tx.payoutTransfer.create({
        data: {
          batchId: batch.id,
          cleanerId: cleaner.cleanerId,
          amountCents: cleaner.eligibleAmountCents,
          currency: "USD",
          status: PayoutTransferStatus.PENDING,
        },
      });

      // Lock ledger entries to this transfer (within transaction)
      const eligibleEntries = await tx.cleanerBalanceLedger.findMany({
        where: {
          cleanerId: cleaner.cleanerId,
          type: "CREDIT",
          status: "POSTED",
          payoutTransferId: null,
        },
        orderBy: { createdAt: "asc" },
      });

      let entriesToLock: typeof eligibleEntries = [];
      let runningTotal = 0;

      for (const entry of eligibleEntries) {
        if (runningTotal + entry.amountCents > cleaner.eligibleAmountCents) {
          break;
        }
        entriesToLock.push(entry);
        runningTotal += entry.amountCents;
      }

      if (entriesToLock.length === 0) {
        throw new Error(
          `No eligible ledger entries found for cleaner ${cleaner.cleanerId}`
        );
      }

      // Lock entries atomically within transaction
      await tx.cleanerBalanceLedger.updateMany({
        where: {
          id: { in: entriesToLock.map((e) => e.id) },
          payoutTransferId: null,
        },
        data: {
          payoutTransferId: transfer.id,
        },
      });

      // Verify locked amount matches expected amount
      if (runningTotal !== cleaner.eligibleAmountCents) {
        throw new Error(
          `Ledger lock mismatch for cleaner ${cleaner.cleanerId}: expected ${cleaner.eligibleAmountCents}, locked ${runningTotal}`
        );
      }

      transfers.push({
        transferId: transfer.id,
        cleanerId: cleaner.cleanerId,
        amountCents: cleaner.eligibleAmountCents,
        lockedEntriesCount: entriesToLock.length,
      });

      totalAmountCents += cleaner.eligibleAmountCents;
    }

    // Update batch with total amount
    await tx.payoutBatch.update({
      where: { id: batch.id },
      data: {
        totalAmountCents,
      },
    });

    return {
      batchId: batch.id,
      totalAmountCents,
      transfers,
    };
  });

  return {
    batchId: result.batchId,
    periodStart,
    periodEnd,
    totalCleaners: allCleaners.length,
    eligibleCleaners: eligibleCleaners.length,
    totalAmountCents: result.totalAmountCents,
    transfers: result.transfers,
    skipped,
  };
}

/**
 * Get batch details including transfer status
 */
export async function getBatchDetails(batchId: string) {
  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: {
      transfers: {
        include: {
          cleaner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ledgerEntries: {
            select: {
              id: true,
              amountCents: true,
            },
          },
        },
      },
    },
  });

  if (!batch) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  return batch;
}

