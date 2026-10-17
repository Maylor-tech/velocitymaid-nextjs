import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ensureJobPayoutLedgerEntry } from '../ensureJobPayoutLedgerEntry';

const findFirst = vi.fn();
const create = vi.fn();

const tx = {
  transactionLedger: {
    findFirst: (...a: unknown[]) => findFirst(...a),
    create: (...a: unknown[]) => create(...a),
  },
} as never;

describe('ensureJobPayoutLedgerEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing ledger without creating a duplicate', async () => {
    findFirst.mockResolvedValue({ id: 'ledger-1' });

    const result = await ensureJobPayoutLedgerEntry(tx, {
      payoutId: 'po-1',
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      branchId: 'branch-1',
      cleanerAmount: 120,
      currency: 'USD',
      description: 'test',
    });

    expect(result).toEqual({ created: false, id: 'ledger-1' });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a ledger row when missing', async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({});

    const result = await ensureJobPayoutLedgerEntry(tx, {
      payoutId: 'po-1',
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      branchId: 'branch-1',
      cleanerAmount: 120,
      currency: 'USD',
      description: 'Payout marked PAID',
      metadata: { methodType: 'ZELLE' },
    });

    expect(result.created).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referenceId: 'po-1',
          referenceType: 'JobPayout',
          transactionType: 'CLEANER_PAYOUT',
          amount: 120,
        }),
      })
    );
  });

  it('treats P2002 race as success and returns raced id', async () => {
    findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ledger-raced' });
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    const result = await ensureJobPayoutLedgerEntry(tx, {
      payoutId: 'po-1',
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      branchId: null,
      cleanerAmount: 80,
      currency: 'USD',
      description: 'race',
    });

    expect(result).toEqual({ created: false, id: 'ledger-raced' });
  });
});
