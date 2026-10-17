import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import type { Prisma as PrismaNS } from '@prisma/client';

type Tx = PrismaNS.TransactionClient;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export type EnsureJobPayoutLedgerParams = {
  payoutId: string;
  jobId: string;
  cleanerId: string;
  branchId: string | null;
  cleanerAmount: number;
  currency: string;
  description: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Idempotent TransactionLedger row for a JobPayout.
 * Safe under concurrent approve / mark-paid / settle (unique + P2002).
 */
export async function ensureJobPayoutLedgerEntry(
  tx: Tx,
  params: EnsureJobPayoutLedgerParams
): Promise<{ created: boolean; id: string }> {
  const existing = await tx.transactionLedger.findFirst({
    where: {
      referenceId: params.payoutId,
      referenceType: 'JobPayout',
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false, id: existing.id };
  }

  const now = params.timestamp ?? new Date();
  const id = randomUUID();

  try {
    await tx.transactionLedger.create({
      data: {
        id,
        branchId: params.branchId,
        transactionType: 'CLEANER_PAYOUT',
        amount: params.cleanerAmount,
        currency: params.currency,
        description: params.description,
        referenceId: params.payoutId,
        referenceType: 'JobPayout',
        cleanerId: params.cleanerId,
        updatedAt: now,
        metadata: {
          jobId: params.jobId,
          payoutId: params.payoutId,
          ...(params.metadata ?? {}),
        },
      },
    });
    return { created: true, id };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await tx.transactionLedger.findFirst({
      where: {
        referenceId: params.payoutId,
        referenceType: 'JobPayout',
      },
      select: { id: true },
    });
    if (!raced) throw error;
    return { created: false, id: raced.id };
  }
}
