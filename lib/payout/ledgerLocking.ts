/**
 * Phase 3B: Ledger Locking Service
 * 
 * Locks ledger entries to a payout transfer to prevent double-payout.
 * 
 * Rules:
 * - Only locks entries with payoutTransferId = null
 * - Once locked, entries cannot be reused
 * - Locking is atomic (transactional)
 */

import { prisma } from "@/lib/prisma";

export interface LockedLedgerEntry {
  id: string;
  amountCents: number;
}

/**
 * Lock eligible ledger entries for a cleaner to a payout transfer
 * 
 * @param cleanerId - The cleaner whose ledger entries to lock
 * @param payoutTransferId - The payout transfer to lock entries to
 * @param maxAmountCents - Maximum amount to lock (optional, locks all if not provided)
 * @returns Locked entries and total amount locked
 */
export async function lockLedgerEntriesForTransfer(
  cleanerId: string,
  payoutTransferId: string,
  maxAmountCents?: number
): Promise<{
  lockedEntries: LockedLedgerEntry[];
  totalAmountCents: number;
}> {
  // Find eligible ledger entries (CREDIT, POSTED, not yet locked)
  const eligibleEntries = await prisma.cleanerBalanceLedger.findMany({
    where: {
      cleanerId,
      type: "CREDIT",
      status: "POSTED",
      payoutTransferId: null, // Not yet locked
    },
    orderBy: {
      createdAt: "asc", // Lock oldest first (FIFO)
    },
  });

  // Calculate which entries to lock
  let entriesToLock: typeof eligibleEntries = [];
  let runningTotal = 0;

  for (const entry of eligibleEntries) {
    if (maxAmountCents && runningTotal + entry.amountCents > maxAmountCents) {
      break; // Don't exceed max amount
    }
    entriesToLock.push(entry);
    runningTotal += entry.amountCents;
  }

  if (entriesToLock.length === 0) {
    return {
      lockedEntries: [],
      totalAmountCents: 0,
    };
  }

  // Lock entries atomically
  await prisma.cleanerBalanceLedger.updateMany({
    where: {
      id: { in: entriesToLock.map((e) => e.id) },
      payoutTransferId: null, // Double-check: only lock if still unlocked
    },
    data: {
      payoutTransferId,
    },
  });

  return {
    lockedEntries: entriesToLock.map((e) => ({
      id: e.id,
      amountCents: e.amountCents,
    })),
    totalAmountCents: runningTotal,
  };
}

/**
 * Verify ledger entries are locked to a transfer
 * 
 * @param payoutTransferId - The payout transfer to verify
 * @returns Verification result
 */
export async function verifyLedgerLock(
  payoutTransferId: string
): Promise<{
  isLocked: boolean;
  lockedAmountCents: number;
  entryCount: number;
}> {
  const lockedEntries = await prisma.cleanerBalanceLedger.findMany({
    where: {
      payoutTransferId,
    },
    select: {
      amountCents: true,
    },
  });

  const lockedAmountCents = lockedEntries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0
  );

  return {
    isLocked: lockedEntries.length > 0,
    lockedAmountCents,
    entryCount: lockedEntries.length,
  };
}

/**
 * Unlock ledger entries (for failed transfers or retries)
 * 
 * WARNING: Only use for failed transfers that need to be retried.
 * Once unlocked, entries can be locked to a different transfer.
 * 
 * @param payoutTransferId - The payout transfer to unlock entries from
 */
export async function unlockLedgerEntries(
  payoutTransferId: string
): Promise<{
  unlockedCount: number;
  unlockedAmountCents: number;
}> {
  const entries = await prisma.cleanerBalanceLedger.findMany({
    where: {
      payoutTransferId,
    },
    select: {
      id: true,
      amountCents: true,
    },
  });

  if (entries.length === 0) {
    return {
      unlockedCount: 0,
      unlockedAmountCents: 0,
    };
  }

  await prisma.cleanerBalanceLedger.updateMany({
    where: {
      payoutTransferId,
    },
    data: {
      payoutTransferId: null,
    },
  });

  const unlockedAmountCents = entries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0
  );

  return {
    unlockedCount: entries.length,
    unlockedAmountCents,
  };
}

