import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  jobFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  jobTeamMemberFindMany: vi.fn(),
  jobOfferFindMany: vi.fn(),
  tipFindUnique: vi.fn(),
  tipFindFirst: vi.fn(),
  tipUpdate: vi.fn(),
  tipUpdateMany: vi.fn(),
  tipWebhookEventFindUnique: vi.fn(),
  tipWebhookEventCreate: vi.fn(),
  tipCreate: vi.fn(),
  logAuditEntry: vi.fn(),
  chargesRetrieve: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => mocks.jobFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => mocks.userFindFirst(...a) },
    jobTeamMember: {
      findMany: (...a: unknown[]) => mocks.jobTeamMemberFindMany(...a),
    },
    jobOffer: {
      findMany: (...a: unknown[]) => mocks.jobOfferFindMany(...a),
    },
    tip: {
      findUnique: (...a: unknown[]) => mocks.tipFindUnique(...a),
      findFirst: (...a: unknown[]) => mocks.tipFindFirst(...a),
      update: (...a: unknown[]) => mocks.tipUpdate(...a),
      updateMany: (...a: unknown[]) => mocks.tipUpdateMany(...a),
      create: (...a: unknown[]) => mocks.tipCreate(...a),
    },
    tipWebhookEvent: {
      findUnique: (...a: unknown[]) => mocks.tipWebhookEventFindUnique(...a),
      create: (...a: unknown[]) => mocks.tipWebhookEventCreate(...a),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

vi.mock('@/lib/tips/references', () => ({
  allocateTipInternalReference: vi.fn(async () => 'VM-TIP-P0C20'),
}));

import { resolveTipServiceEarner } from '@/lib/tips/beneficiary';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';
import { createTipIntent } from '@/lib/tips/createTipIntent';
import { markTipReceived } from '@/lib/tips/markTipReceived';
import { markTipPaidOut } from '@/lib/tips/markTipPaidOut';
import {
  applyTipDisputeClosed,
  applyTipDisputeOpened,
  applyTipFullRefund,
} from '@/lib/tips/tipReversal';
import { cleanerTipEntitlementCents } from '@/lib/tips/tipPolicy';
import { isTipPayable } from '@/lib/tips/statuses';
import { TIP_PLATFORM_SHARE_CENTS as POLICY_SHARE } from '@/lib/tips/tipPolicy';
import { buildTipReconFlags } from '@/lib/tips/tipReconciliation';

describe('P0-C tip financial controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue(undefined);
    mocks.jobTeamMemberFindMany.mockResolvedValue([]);
    mocks.jobOfferFindMany.mockResolvedValue([]);
    mocks.tipWebhookEventFindUnique.mockResolvedValue(null);
    mocks.tipWebhookEventCreate.mockResolvedValue({});
    mocks.tipFindFirst.mockResolvedValue(null);
  });

  it('policy: $20 face value = $20 entitlement, $0 platform share', () => {
    expect(cleanerTipEntitlementCents(2000)).toBe(2000);
    expect(POLICY_SHARE).toBe(0);
  });

  it('successful receive preserves full entitlement on audit', async () => {
    mocks.tipFindUnique.mockResolvedValue({
      id: 'tip-20',
      amount: 2000,
      status: 'PENDING',
      beneficiaryCleanerId: 'cleaner-1',
      stripeEventId: null,
      receivedAt: null,
      refundedAt: null,
    });
    mocks.tipUpdate.mockResolvedValue({ id: 'tip-20', status: 'RECEIVED' });

    const result = await markTipReceived({
      tipId: 'tip-20',
      amountCents: 2000,
      stripeEventId: 'evt_ok',
      source: 'STRIPE_WEBHOOK',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entitlementCents).toBe(2000);
      expect(result.status).toBe('RECEIVED');
    }
    expect(mocks.logAuditEntry.mock.calls[0][0].changes.platformShareCents).toBe(
      0
    );
  });

  it('duplicate success webhook is idempotent', async () => {
    mocks.tipFindUnique.mockResolvedValue({
      id: 'tip-20',
      amount: 2000,
      status: 'RECEIVED',
      beneficiaryCleanerId: 'cleaner-1',
      stripeEventId: 'evt_ok',
      receivedAt: new Date(),
      refundedAt: null,
    });

    const result = await markTipReceived({
      tipId: 'tip-20',
      amountCents: 2000,
      stripeEventId: 'evt_ok',
      source: 'STRIPE_WEBHOOK',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyReceived).toBe(true);
    expect(mocks.tipUpdate).not.toHaveBeenCalled();
  });

  it('refund before PAID_OUT → REFUNDED not payable', async () => {
    mocks.tipFindUnique
      .mockResolvedValueOnce({
        id: 'tip-20',
        amount: 2000,
        status: 'RECEIVED',
        beneficiaryCleanerId: 'cleaner-1',
        refundedAt: null,
        disputeStatus: 'NONE',
        needsReconcile: false,
      })
      .mockResolvedValueOnce({
        status: 'REFUNDED',
        disputeStatus: 'NONE',
        needsReconcile: false,
      });
    mocks.tipUpdate.mockResolvedValue({});

    const result = await applyTipFullRefund({
      tipId: 'tip-20',
      stripeEventId: 'evt_ref',
      eventType: 'charge.refunded',
    });

    expect(result.ok).toBe(true);
    expect(mocks.tipUpdate.mock.calls[0][0].data.status).toBe('REFUNDED');
    expect(
      isTipPayable({
        status: 'REFUNDED',
        beneficiaryCleanerId: 'cleaner-1',
        disputeStatus: 'NONE',
        refundedAt: new Date(),
      })
    ).toBe(false);
  });

  it('duplicate refund event is idempotent', async () => {
    mocks.tipWebhookEventFindUnique.mockResolvedValue({
      tipId: 'tip-20',
      outcome: 'PROCESSED',
    });
    mocks.tipFindUnique.mockResolvedValue({
      id: 'tip-20',
      status: 'REFUNDED',
      disputeStatus: 'NONE',
      needsReconcile: false,
    });

    const result = await applyTipFullRefund({
      tipId: 'tip-20',
      stripeEventId: 'evt_ref_dup',
      eventType: 'charge.refunded',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyProcessed).toBe(true);
    expect(mocks.tipUpdate).not.toHaveBeenCalled();
  });

  it('dispute before PAID_OUT blocks settlement', async () => {
    mocks.tipFindUnique.mockResolvedValue({
      id: 'tip-20',
      amount: 2000,
      status: 'RECEIVED',
      disputeStatus: 'NONE',
      needsReconcile: false,
    });
    mocks.tipUpdate.mockResolvedValue({});

    await applyTipDisputeOpened({
      tipId: 'tip-20',
      stripeEventId: 'evt_disp',
      eventType: 'charge.dispute.created',
    });

    expect(mocks.tipUpdate.mock.calls[0][0].data.disputeStatus).toBe('OPEN');

    mocks.tipFindUnique.mockResolvedValue({
      id: tipReceivedForPaidOut().id,
      ...tipReceivedForPaidOut(),
      disputeStatus: 'OPEN',
    });

    const paid = await markTipPaidOut({
      tipId: 'tip-20',
      adminId: 'admin-1',
      paidOutMethod: 'ZELLE',
    });
    expect(paid).toMatchObject({ ok: false, code: 'DISPUTE_BLOCK' });
  });

  it('dispute won restores payable when RECEIVED', async () => {
    mocks.tipFindUnique
      .mockResolvedValueOnce({
        id: 'tip-20',
        amount: 2000,
        status: 'RECEIVED',
        disputeStatus: 'OPEN',
        needsReconcile: false,
        refundedAt: null,
      })
      .mockResolvedValueOnce({
        status: 'RECEIVED',
        disputeStatus: 'WON',
        needsReconcile: false,
      });
    mocks.tipUpdate.mockResolvedValue({});

    const result = await applyTipDisputeClosed({
      tipId: 'tip-20',
      stripeEventId: 'evt_won',
      eventType: 'charge.dispute.closed',
      stripeDisputeStatus: 'won',
    });

    expect(result.ok).toBe(true);
    expect(mocks.tipUpdate.mock.calls[0][0].data.disputeStatus).toBe('WON');
    expect(
      isTipPayable({
        status: 'RECEIVED',
        beneficiaryCleanerId: 'cleaner-1',
        disputeStatus: 'WON',
      })
    ).toBe(true);
  });

  it('dispute lost before payout → REFUNDED', async () => {
    mocks.tipFindUnique
      .mockResolvedValueOnce({
        id: 'tip-20',
        amount: 2000,
        status: 'RECEIVED',
        disputeStatus: 'OPEN',
        needsReconcile: false,
        refundedAt: null,
      })
      .mockResolvedValueOnce({
        status: 'REFUNDED',
        disputeStatus: 'LOST',
        needsReconcile: false,
      });
    mocks.tipUpdate.mockResolvedValue({});

    await applyTipDisputeClosed({
      tipId: 'tip-20',
      stripeEventId: 'evt_lost',
      eventType: 'charge.dispute.closed',
      stripeDisputeStatus: 'lost',
    });

    expect(mocks.tipUpdate.mock.calls[0][0].data.status).toBe('REFUNDED');
    expect(mocks.tipUpdate.mock.calls[0][0].data.disputeStatus).toBe('LOST');
  });

  it('refund after PAID_OUT preserves PAID_OUT + needsReconcile', async () => {
    mocks.tipFindUnique
      .mockResolvedValueOnce({
        id: 'tip-20',
        amount: 2000,
        status: 'PAID_OUT',
        beneficiaryCleanerId: 'cleaner-1',
        refundedAt: null,
        disputeStatus: 'NONE',
        needsReconcile: false,
      })
      .mockResolvedValueOnce({
        status: 'PAID_OUT',
        disputeStatus: 'NONE',
        needsReconcile: true,
      });
    mocks.tipUpdate.mockResolvedValue({});

    const result = await applyTipFullRefund({
      tipId: 'tip-20',
      stripeEventId: 'evt_ref_after',
      eventType: 'charge.refunded',
    });

    expect(result.ok).toBe(true);
    const data = mocks.tipUpdate.mock.calls[0][0].data;
    expect(data.status).toBeUndefined(); // status not rewritten
    expect(data.needsReconcile).toBe(true);
    expect(data.reconcileReason).toBe('REFUND_AFTER_PAID_OUT');
  });

  it('valid manual PAID_OUT is idempotent and does not claim transfer', async () => {
    mocks.tipFindUnique.mockResolvedValue(tipReceivedForPaidOut());
    mocks.tipUpdate.mockResolvedValue({});

    const first = await markTipPaidOut({
      tipId: 'tip-20',
      adminId: 'admin-1',
      paidOutMethod: 'ZELLE',
      payoutReference: 'memo-1',
    });
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.fundsTransferredByApi).toBe(false);
      expect(first.alreadyPaidOut).toBe(false);
    }

    mocks.tipFindUnique.mockResolvedValue({
      ...tipReceivedForPaidOut(),
      status: 'PAID_OUT',
      paidOutAt: new Date(),
    });
    const second = await markTipPaidOut({
      tipId: 'tip-20',
      adminId: 'admin-1',
      paidOutMethod: 'ZELLE',
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.alreadyPaidOut).toBe(true);
      expect(second.fundsTransferredByApi).toBe(false);
    }
  });

  it('rejects unsafe mark-paid-out attempts', async () => {
    for (const bad of [
      {
        ...tipReceivedForPaidOut(),
        status: 'PENDING',
        receivedAt: null,
        code: 'NOT_RECEIVED',
      },
      { ...tipReceivedForPaidOut(), status: 'FAILED', code: 'FAILED' },
      {
        ...tipReceivedForPaidOut(),
        status: 'REFUNDED',
        refundedAt: new Date(),
        code: 'REFUNDED',
      },
      {
        ...tipReceivedForPaidOut(),
        beneficiaryCleanerId: null,
        code: 'NO_BENEFICIARY',
      },
      {
        ...tipReceivedForPaidOut(),
        stripePaymentIntentId: null,
        code: 'UNCONFIRMED_PAYMENT',
      },
      {
        ...tipReceivedForPaidOut(),
        needsReconcile: true,
        code: 'NEEDS_RECONCILE',
      },
    ]) {
      mocks.tipFindUnique.mockResolvedValue(bad);
      const result = await markTipPaidOut({
        tipId: 'tip-20',
        adminId: 'admin-1',
        paidOutMethod: 'ZELLE',
      });
      expect(result).toMatchObject({ ok: false, code: bad.code });
    }
  });

  it('team ambiguity fails closed', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-a',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: 'vermont',
      completedAt: new Date(),
    });
    mocks.jobTeamMemberFindMany.mockResolvedValue([
      { cleanerId: 'cleaner-a' },
      { cleanerId: 'cleaner-b' },
    ]);
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-a' });

    await expect(resolveTipServiceEarner('job-1')).rejects.toMatchObject({
      code: 'AMBIGUOUS_SERVICE_EARNERS',
    });
    await expect(resolveTipServiceEarner('job-1')).rejects.toBeInstanceOf(
      TipBeneficiaryError
    );
  });

  it('accepted JobOffers for multiple cleaners fail closed', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-a',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: 'vermont',
      completedAt: new Date(),
    });
    mocks.jobOfferFindMany.mockResolvedValue([
      { cleanerId: 'cleaner-a' },
      { cleanerId: 'cleaner-caryll' },
    ]);

    await expect(resolveTipServiceEarner('job-1')).rejects.toMatchObject({
      code: 'AMBIGUOUS_SERVICE_EARNERS',
    });
  });

  it('Stripe/DB mismatch flag when PI attached but PENDING', () => {
    const flags = buildTipReconFlags({
      status: 'PENDING',
      stripePaymentIntentId: 'pi_123',
      receivedAt: null,
      disputeStatus: 'NONE',
    });
    expect(flags.possibleStripeDbMismatch).toBe(true);
    expect(flags.needsReconcile).toBe(true);
    expect(flags.payable).toBe(false);
  });

  it('createTipIntent freezes beneficiary and stores full cents', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-dorottya',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: 'vermont',
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-dorottya' });
    mocks.tipCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'tip-1',
        ...data,
      })
    );

    const intent = await createTipIntent({
      jobId: 'job-1',
      amountCents: 2000,
      paymentMethod: 'STRIPE',
    });
    expect(intent.amountCents).toBe(2000);
    expect(intent.beneficiaryCleanerId).toBe('cleaner-dorottya');
  });
});

function tipReceivedForPaidOut() {
  return {
    id: 'tip-20',
    status: 'RECEIVED',
    beneficiaryCleanerId: 'cleaner-1',
    amount: 2000,
    paidOutAt: null,
    receivedAt: new Date(),
    refundedAt: null,
    disputeStatus: 'NONE',
    needsReconcile: false,
    paymentMethod: 'STRIPE',
    stripePaymentIntentId: 'pi_abc',
    providerReference: 'pi_abc',
  };
}
