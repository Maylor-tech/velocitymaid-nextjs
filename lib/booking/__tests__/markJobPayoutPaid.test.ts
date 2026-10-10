import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

const jobPayoutFindUnique = vi.fn();
const jobPayoutUpdate = vi.fn();
const transactionLedgerFindFirst = vi.fn();
const transactionLedgerCreate = vi.fn();
const logAuditEntry = vi.fn();
const loadPayoutExecutionDecision = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobPayout: {
      findUnique: (...a: unknown[]) => jobPayoutFindUnique(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        jobPayout: { update: (...a: unknown[]) => jobPayoutUpdate(...a) },
        transactionLedger: {
          findFirst: (...a: unknown[]) => transactionLedgerFindFirst(...a),
          create: (...a: unknown[]) => transactionLedgerCreate(...a),
        },
      }),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

vi.mock('@/lib/payout/loadPayoutExecutionDecision', () => ({
  loadPayoutExecutionDecision: (...a: unknown[]) => loadPayoutExecutionDecision(...a),
}));

import { markJobPayoutPaid } from '../markJobPayoutPaid';

function readyPayout(overrides: Record<string, unknown> = {}) {
  return {
    id: ELIZABETH_K_PHASE2.payoutId,
    jobId: ELIZABETH_K_PHASE2.jobId,
    cleanerId: 'cleaner-1',
    branchId: 'branch-1',
    status: 'READY',
    cleanerAmount: 276.25,
    currency: 'USD',
    paidAt: null,
    policyEvalDetails: {},
    ...overrides,
  };
}

describe('markJobPayoutPaid hold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobPayoutFindUnique.mockResolvedValue(readyPayout());
    jobPayoutUpdate.mockResolvedValue({});
    transactionLedgerFindFirst.mockResolvedValue(null);
    transactionLedgerCreate.mockResolvedValue({});
    logAuditEntry.mockResolvedValue('audit-1');
  });

  it('blocks the Elizabeth K READY $276.25 payout with 409 and writes nothing', async () => {
    loadPayoutExecutionDecision.mockResolvedValue({
      hold: true,
      mutatePayout: false,
      execute: false,
      code: 'PAYOUT_HOLD_QUOTE_BASIS',
      reason: 'Elizabeth K payout is still on the preserved $425 quote ($276.25).',
      preview: { cleanerAmount: 162.5 },
      payoutId: ELIZABETH_K_PHASE2.payoutId,
      jobId: ELIZABETH_K_PHASE2.jobId,
    });

    const result = await markJobPayoutPaid({
      payoutId: ELIZABETH_K_PHASE2.payoutId,
      adminId: 'admin-1',
      paidMethodType: 'ZELLE',
      reference: 'zelle-should-not-write',
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      code: 'PAYOUT_HOLD_QUOTE_BASIS',
      error: 'Elizabeth K payout is still on the preserved $425 quote ($276.25).',
    });
    expect(jobPayoutUpdate).not.toHaveBeenCalled();
    expect(transactionLedgerCreate).not.toHaveBeenCalled();
    expect(logAuditEntry).not.toHaveBeenCalled();
  });

  it('marks an unrelated READY payout PAID', async () => {
    jobPayoutFindUnique
      .mockResolvedValueOnce(
        readyPayout({
          id: 'other-payout',
          jobId: 'other-job',
          cleanerAmount: 172.25,
        })
      )
      .mockResolvedValueOnce({
        id: 'other-payout',
        jobId: 'other-job',
        status: 'PAID',
        paidAt: new Date('2026-10-10T12:00:00.000Z'),
        executionMethod: 'ZELLE',
        externalReferenceId: 'ref-1',
        policyEvalDetails: {},
      });
    loadPayoutExecutionDecision.mockResolvedValue({
      hold: false,
      mutatePayout: false,
      execute: false,
      code: null,
      reason: null,
      preview: null,
      payoutId: 'other-payout',
      jobId: 'other-job',
    });

    const result = await markJobPayoutPaid({
      payoutId: 'other-payout',
      adminId: 'admin-1',
      paidMethodType: 'ZELLE',
      reference: 'ref-1',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payout.status).toBe('PAID');
    }
    expect(jobPayoutUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID' }),
      })
    );
    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYOUT_MARK_PAID' })
    );
  });
});
