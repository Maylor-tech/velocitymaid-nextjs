import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobStatus, PaymentStatus } from '@prisma/client';
import { calcPayout } from '@/lib/payoutRules';

const mocks = vi.hoisted(() => ({
  findUniqueJob: vi.fn(),
  findUniquePayout: vi.fn(),
  findFirstOffer: vi.fn(),
  createPayout: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => mocks.findUniqueJob(...a) },
    jobPayout: {
      findUnique: (...a: unknown[]) => mocks.findUniquePayout(...a),
      create: (...a: unknown[]) => mocks.createPayout(...a),
    },
    jobOffer: {
      findFirst: (...a: unknown[]) => mocks.findFirstOffer(...a),
    },
    auditLog: { create: (...a: unknown[]) => mocks.createAudit(...a) },
  },
}));

import { createPayoutIfEligible } from '@/src/server/payout/createPayoutIfEligible';
import { maybeCreatePayoutAfterTransition } from '@/lib/booking/maybeCreatePayoutAfterTransition';

function baseJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    status: JobStatus.COMPLETED,
    paymentStatus: PaymentStatus.PENDING,
    totalPrice: 265,
    quotedTotal: 265,
    operationalTotal: null,
    branchId: 'b1',
    assignedCleanerId: 'cleaner-1',
    currency: 'USD',
    ...overrides,
  };
}

describe('Phase 7D-1 cleaner compensation ledger integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniquePayout.mockResolvedValue(null);
    mocks.findFirstOffer.mockResolvedValue(null);
    mocks.createPayout.mockImplementation(
      async ({ data }: { data: { id: string } }) => data
    );
    mocks.createAudit.mockResolvedValue({});
  });

  it('1. accepted offer amount becomes JobPayout.cleanerAmount', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });

    const result = await createPayoutIfEligible('job-1');
    expect(result.ok).toBe(true);
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.cleanerAmount).toBe(172.25);
    expect(data.status).toBe('READY');
    expect(data.rulesVersion).toBe('accepted-offer');
    expect(data.policyEvalDetails.compensationSource).toBe('ACCEPTED_OFFER');
    expect(data.policyEvalDetails.acceptedOfferId).toBe('offer-1');
    // Offer wins even when 65% of customer total happens to equal the offer
    // (265 * 0.65 = 172.25). Prove source is ACCEPTED_OFFER, not formula.
    expect(data.policyEvalDetails.compensationSource).toBe('ACCEPTED_OFFER');
    expect(data.rulesVersion).not.toBe('v1-65-35');
  });

  it('2. customer price cannot alter accepted cleaner compensation', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ totalPrice: 999, quotedTotal: 999, operationalTotal: 800 })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });

    await createPayoutIfEligible('job-1');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.cleanerAmount).toBe(172.25);
  });

  it('3. COMPLETED + customer PENDING creates READY payable', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.PENDING })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });

    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reason).toBe('CREATED');
    expect(mocks.createPayout.mock.calls[0][0].data.status).toBe('READY');
    expect(
      mocks.createPayout.mock.calls[0][0].data.policyEvalDetails
        .customerPaymentStatus
    ).toBe('PENDING');
  });

  it('4. COMPLETED + BALANCE_DUE creates READY payable', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.BALANCE_DUE })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });

    const result = await createPayoutIfEligible('job-1');
    expect(result.ok).toBe(true);
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('5. prepaid + completion creates one payable', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.PAID })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });

    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result.ok && result.reason === 'CREATED').toBe(true);
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('6. completion-first then payment later remains one payable', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.PENDING })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });
    mocks.findUniquePayout
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'payout-existing' });

    const first = await createPayoutIfEligible('job-1');
    // Simulate customer paid later — same create gate
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.PAID })
    );
    const second = await createPayoutIfEligible('job-1');

    expect(first.ok && first.reason === 'CREATED').toBe(true);
    expect(second).toEqual({
      ok: true,
      reason: 'ALREADY_EXISTS',
      payoutId: 'payout-existing',
    });
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('7. duplicate completion no duplicate', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });
    mocks.findUniquePayout
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'payout-1' });

    await createPayoutIfEligible('job-1');
    await createPayoutIfEligible('job-1');
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('8. duplicate payment webhook path no duplicate', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.PAID })
    );
    mocks.findUniquePayout.mockResolvedValue({ id: 'payout-1' });

    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({
      ok: true,
      reason: 'ALREADY_EXISTS',
      payoutId: 'payout-1',
    });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('9. released cleaner ACCEPTED offer not used for unassigned job', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ assignedCleanerId: null })
    );
    // Even if an offer existed, gate fails on NO_CLEANER before offer lookup matters
    const result = await createPayoutIfEligible('job-1');
    expect(result).toEqual({ ok: false, reason: 'NO_CLEANER' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('9b. released cleaner ACCEPTED offer not used for replacement cleaner', async () => {
    // Current assignee is cleaner-2; only findFirst is scoped to assignedCleanerId
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ assignedCleanerId: 'cleaner-2' })
    );
    // Prisma query filters cleanerId=cleaner-2; released cleaner-1 offer not returned
    mocks.findFirstOffer.mockResolvedValue(null);

    const result = await createPayoutIfEligible('job-1');
    expect(result.ok).toBe(true);
    const where = mocks.findFirstOffer.mock.calls[0][0].where;
    expect(where.cleanerId).toBe('cleaner-2');
    expect(where.status).toBe('ACCEPTED');
    // Falls back to calculated for cleaner-2 (no their accepted offer)
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.cleanerId).toBe('cleaner-2');
    expect(data.policyEvalDetails.compensationSource).toBe(
      'CALCULATED_FALLBACK'
    );
    expect(data.cleanerAmount).toBe(calcPayout(265).cleanerAmount);
  });

  it('10. reassigned cleaner valid accepted offer used', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ assignedCleanerId: 'cleaner-2' })
    );
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-2',
      compensationAmount: 180,
      cleanerId: 'cleaner-2',
    });

    await createPayoutIfEligible('job-1');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.cleanerId).toBe('cleaner-2');
    expect(data.cleanerAmount).toBe(180);
    expect(data.policyEvalDetails.compensationSource).toBe('ACCEPTED_OFFER');
  });

  it('11. legacy/no-offer fallback explicit CALCULATED_FALLBACK', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({
        paymentStatus: PaymentStatus.PAID,
        totalPrice: 200,
        quotedTotal: 365,
        operationalTotal: null,
      })
    );
    mocks.findFirstOffer.mockResolvedValue(null);

    await createPayoutIfEligible('job-1');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(365);
    expect(data.cleanerAmount).toBe(calcPayout(365).cleanerAmount);
    expect(data.policyEvalDetails.compensationSource).toBe(
      'CALCULATED_FALLBACK'
    );
    expect(data.rulesVersion).toBe('v1-65-35');
  });

  it('11b. protected ops total used only for CALCULATED_FALLBACK (not offer)', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({
        totalPrice: 365,
        quotedTotal: 365,
        operationalTotal: 350,
        paymentStatus: PaymentStatus.PAID,
      })
    );
    mocks.findFirstOffer.mockResolvedValue(null);

    await createPayoutIfEligible('job-1');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(350);
    expect(data.cleanerAmount).toBe(227.5);
  });

  it('12. unassigned / no safe compensation fails closed', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({
        assignedCleanerId: 'cleaner-1',
        totalPrice: null,
        quotedTotal: null,
        operationalTotal: null,
      })
    );
    mocks.findFirstOffer.mockResolvedValue(null);

    const result = await createPayoutIfEligible('job-1');
    expect(result).toEqual({ ok: false, reason: 'NO_SAFE_COMPENSATION' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('12b. incomplete job fails closed', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ status: JobStatus.IN_PROGRESS })
    );
    const result = await createPayoutIfEligible('job-1');
    expect(result).toEqual({ ok: false, reason: 'NOT_COMPLETED' });
  });

  it('13. tips untouched — create path never writes Tip', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });
    await createPayoutIfEligible('job-1');
    // Only jobPayout + auditLog creates in this module's prisma mock surface
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
    expect(mocks.createAudit).toHaveBeenCalledTimes(1);
  });

  it('14. no money transfer — status READY only, no paidAt/executedAt', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findFirstOffer.mockResolvedValue({
      id: 'offer-1',
      compensationAmount: 172.25,
      cleanerId: 'cleaner-1',
    });
    await createPayoutIfEligible('job-1');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.status).toBe('READY');
    expect(data.paidAt).toBeUndefined();
    expect(data.executedAt).toBeUndefined();
  });
});
