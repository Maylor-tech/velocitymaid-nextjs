import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcPayout } from '@/lib/payoutRules';

const mocks = vi.hoisted(() => ({
  findUniqueJob: vi.fn(),
  findUniqueUser: vi.fn(),
  findUniquePayout: vi.fn(),
  findFirstOffer: vi.fn(),
  createPayout: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => mocks.findUniqueJob(...a) },
    user: { findUnique: (...a: unknown[]) => mocks.findUniqueUser(...a) },
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
import {
  BRIAN_OWNER_CLEANER_ID,
  CARYLL_CLEANER_ID,
} from '@/lib/payout/ownerAssignee';

/**
 * Retained processing-protection cases (legacy CALCULATED_FALLBACK).
 * Offer-based cases live in createPayoutIfEligible.ledgerIntegrity.test.ts.
 */
describe('createPayoutIfEligible processing protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniquePayout.mockResolvedValue(null);
    mocks.findFirstOffer.mockResolvedValue(null);
    mocks.findUniqueUser.mockResolvedValue({
      id: 'c1',
      email: 'cleaner@example.com',
      role: 'CLEANER',
    });
    mocks.createPayout.mockImplementation(
      async ({ data }: { data: { id: string } }) => data
    );
    mocks.createAudit.mockResolvedValue({});
  });

  it('payout uses $350 operational, not $365 customer (65% = 227.50)', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 365,
      quotedTotal: 365,
      operationalTotal: 350,
      branchId: 'b1',
      assignedCleanerId: 'c1',
      currency: 'USD',
    });

    const result = await createPayoutIfEligible('job-1');
    expect(result.ok).toBe(true);
    expect(mocks.createPayout).toHaveBeenCalled();
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(350);
    expect(data.cleanerAmount).toBe(227.5);
    expect(data.cleanerAmount).not.toBe(calcPayout(365).cleanerAmount);
    expect(data.policyEvalDetails.compensationSource).toBe(
      'CALCULATED_FALLBACK'
    );
  });

  it('legacy payout fallback unchanged when operationalTotal is null', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-legacy',
      status: 'COMPLETED',
      paymentStatus: 'PENDING',
      totalPrice: 200,
      quotedTotal: 365,
      operationalTotal: null,
      branchId: 'b1',
      assignedCleanerId: 'c1',
      currency: 'USD',
    });

    await createPayoutIfEligible('job-legacy');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(365);
    expect(data.cleanerAmount).toBe(calcPayout(365).cleanerAmount);
  });

  it('does not pay a historical ACCEPTED offer after the cleaner was released', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-oct4',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 265,
      quotedTotal: 265,
      operationalTotal: 200,
      branchId: 'b1',
      assignedCleanerId: null,
      currency: 'USD',
    });

    const result = await createPayoutIfEligible('job-oct4');
    expect(result).toEqual({ ok: false, reason: 'NO_CLEANER' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('Gate 2b: owner assignee id skips JobPayout create', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-chris',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 265,
      quotedTotal: 265,
      operationalTotal: 200,
      branchId: 'b1',
      assignedCleanerId: BRIAN_OWNER_CLEANER_ID,
      currency: 'USD',
    });
    mocks.findUniqueUser.mockResolvedValue({
      id: BRIAN_OWNER_CLEANER_ID,
      email: 'other@example.com',
      role: 'CLEANER',
    });

    const result = await createPayoutIfEligible('job-chris');
    expect(result).toEqual({ ok: false, reason: 'OWNER_ASSIGNEE' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('Gate 2b: ADMIN_EMAIL assignee skips JobPayout create', async () => {
    const prev = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = 'admin@velocitymaid.com';
    try {
      mocks.findUniqueJob.mockResolvedValue({
        id: 'job-owner-email',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        totalPrice: 265,
        quotedTotal: 265,
        operationalTotal: 200,
        branchId: 'b1',
        assignedCleanerId: 'user-owner',
        currency: 'USD',
      });
      mocks.findUniqueUser.mockResolvedValue({
        id: 'user-owner',
        email: 'Admin@VelocityMaid.com',
        role: 'ADMIN',
      });

      const result = await createPayoutIfEligible('job-owner-email');
      expect(result).toEqual({ ok: false, reason: 'OWNER_ASSIGNEE' });
      expect(mocks.createPayout).not.toHaveBeenCalled();
    } finally {
      if (prev === undefined) delete process.env.ADMIN_EMAIL;
      else process.env.ADMIN_EMAIL = prev;
    }
  });

  it('Gate 2b: Caryll still creates READY payout', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-caryll',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 265,
      quotedTotal: 265,
      operationalTotal: 200,
      branchId: 'b1',
      assignedCleanerId: CARYLL_CLEANER_ID,
      currency: 'USD',
    });
    mocks.findUniqueUser.mockResolvedValue({
      id: CARYLL_CLEANER_ID,
      email: 'caryll@velocitymaid.com',
      role: 'CLEANER',
    });

    const result = await createPayoutIfEligible('job-caryll');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reason).toBe('CREATED');
    expect(mocks.createPayout).toHaveBeenCalled();
  });
});
