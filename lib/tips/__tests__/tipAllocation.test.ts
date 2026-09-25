import { beforeEach, describe, expect, it, vi } from 'vitest';

const tipFindUnique = vi.fn();
const tipUpdate = vi.fn();
const tipAllocationFindUnique = vi.fn();
const tipAllocationFindMany = vi.fn();
const tipAllocationCount = vi.fn();
const tipAllocationCreate = vi.fn();
const tipAllocationUpdate = vi.fn();
const tipAllocationUpdateMany = vi.fn();
const tipAllocationDeleteMany = vi.fn();
const transaction = vi.fn();
const logAuditEntry = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tip: {
      findUnique: (...args: unknown[]) => tipFindUnique(...args),
      update: (...args: unknown[]) => tipUpdate(...args),
    },
    tipAllocation: {
      findUnique: (...args: unknown[]) => tipAllocationFindUnique(...args),
      findMany: (...args: unknown[]) => tipAllocationFindMany(...args),
      count: (...args: unknown[]) => tipAllocationCount(...args),
      create: (...args: unknown[]) => tipAllocationCreate(...args),
      update: (...args: unknown[]) => tipAllocationUpdate(...args),
      updateMany: (...args: unknown[]) => tipAllocationUpdateMany(...args),
      deleteMany: (...args: unknown[]) => tipAllocationDeleteMany(...args),
    },
    tipWebhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: (fn: (tx: unknown) => unknown) => transaction(fn),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => logAuditEntry(...args),
}));

import {
  assertValidAllocationLines,
  cancelOwedTipAllocations,
  markTipAllocationPaidOut,
  setTipAllocations,
  summarizeAllocations,
} from '@/lib/tips/tipAllocation';
import { markTipPaidOut } from '@/lib/tips/markTipPaidOut';
import { tipHasPayableAllocations } from '@/lib/tips/statuses';
import { buildTipReconFlags } from '@/lib/tips/tipReconciliation';
import { applyTipFullRefund } from '@/lib/tips/tipReversal';

describe('TipAllocation invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        tipAllocation: {
          deleteMany: tipAllocationDeleteMany,
          create: tipAllocationCreate,
          update: tipAllocationUpdate,
          findMany: tipAllocationFindMany,
        },
        tip: { update: tipUpdate },
      };
      return fn(tx);
    });
  });

  it('$50 → $25 + $25 validates and summarizes', () => {
    const lines = [
      { cleanerId: 'brian', amountCents: 2500 },
      { cleanerId: 'caryll', amountCents: 2500 },
    ];
    expect(assertValidAllocationLines(5000, lines)).toEqual({ ok: true });
    const summary = summarizeAllocations(5000, [
      { amountCents: 2500, status: 'OWED' },
      { amountCents: 2500, status: 'OWED' },
    ]);
    expect(summary.allocatedCents).toBe(5000);
    expect(summary.fullyAllocated).toBe(true);
    expect(summary.owedCents).toBe(5000);
  });

  it('rejects over-allocation', () => {
    const r = assertValidAllocationLines(5000, [
      { cleanerId: 'a', amountCents: 3000 },
      { cleanerId: 'b', amountCents: 3000 },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe('OVER_ALLOCATED');
  });

  it('rejects under-allocation for full sets', () => {
    const r = assertValidAllocationLines(5000, [
      { cleanerId: 'a', amountCents: 2500 },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe('UNDER_ALLOCATED');
  });

  it('rejects zero/negative and duplicate cleaners', () => {
    expect(
      assertValidAllocationLines(5000, [
        { cleanerId: 'a', amountCents: 0 },
        { cleanerId: 'b', amountCents: 5000 },
      ]).ok
    ).toBe(false);
    expect(
      assertValidAllocationLines(5000, [
        { cleanerId: 'a', amountCents: 2500 },
        { cleanerId: 'a', amountCents: 2500 },
      ]).ok
    ).toBe(false);
  });

  it('setTipAllocations creates Brian/Caryll $25 OWED', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-50',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      refundedAt: null,
      TipAllocation: [],
    });
    tipAllocationDeleteMany.mockResolvedValue({ count: 0 });
    tipAllocationCreate
      .mockResolvedValueOnce({
        id: 'alloc-b',
        cleanerId: 'brian',
        amountCents: 2500,
      })
      .mockResolvedValueOnce({
        id: 'alloc-c',
        cleanerId: 'caryll',
        amountCents: 2500,
      });

    const result = await setTipAllocations({
      tipId: 'tip-50',
      adminId: 'admin-1',
      lines: [
        { cleanerId: 'brian', amountCents: 2500 },
        { cleanerId: 'caryll', amountCents: 2500 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.allocations).toHaveLength(2);
      expect(result.allocations.map((a) => a.amountCents).sort()).toEqual([
        2500, 2500,
      ]);
    }
  });

  it('one allocation PAID_OUT / one OWED — parent not settled', async () => {
    tipAllocationFindUnique.mockResolvedValue({
      id: 'alloc-b',
      tipId: 'tip-50',
      cleanerId: 'brian',
      amountCents: 2500,
      status: 'OWED',
      Tip: {
        id: 'tip-50',
        status: 'RECEIVED_UNATTRIBUTED',
        amount: 5000,
        receivedAt: new Date(),
        refundedAt: null,
        disputeStatus: 'NONE',
        needsReconcile: false,
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: 'pi_x',
        TipAllocation: [
          { id: 'alloc-b', status: 'OWED', amountCents: 2500 },
          { id: 'alloc-c', status: 'OWED', amountCents: 2500 },
        ],
      },
    });
    tipAllocationFindMany.mockResolvedValue([
      { status: 'PAID_OUT', amountCents: 2500 },
      { status: 'OWED', amountCents: 2500 },
    ]);

    const result = await markTipAllocationPaidOut({
      allocationId: 'alloc-b',
      adminId: 'admin-1',
      payoutMethod: 'ZELLE',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fundsTransferredByApi).toBe(false);
      expect(result.parentStatus).toBe('RECEIVED_UNATTRIBUTED');
    }
    expect(tipUpdate).not.toHaveBeenCalled();
  });

  it('all allocations PAID_OUT → parent PAID_OUT', async () => {
    tipAllocationFindUnique.mockResolvedValue({
      id: 'alloc-c',
      tipId: 'tip-50',
      cleanerId: 'caryll',
      amountCents: 2500,
      status: 'OWED',
      Tip: {
        id: 'tip-50',
        status: 'RECEIVED_UNATTRIBUTED',
        amount: 5000,
        receivedAt: new Date(),
        refundedAt: null,
        disputeStatus: 'NONE',
        needsReconcile: false,
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: 'pi_x',
        TipAllocation: [],
      },
    });
    tipAllocationFindMany.mockResolvedValue([
      { status: 'PAID_OUT', amountCents: 2500 },
      { status: 'PAID_OUT', amountCents: 2500 },
    ]);

    const result = await markTipAllocationPaidOut({
      allocationId: 'alloc-c',
      adminId: 'admin-1',
      payoutMethod: 'ZELLE',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parentStatus).toBe('PAID_OUT');
      expect(result.fundsTransferredByApi).toBe(false);
    }
    expect(tipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID_OUT' }),
      })
    );
  });

  it('parent markTipPaidOut blocked when allocations exist', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-50',
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      amount: 5000,
      paidOutAt: null,
      receivedAt: new Date(),
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      paymentMethod: 'STRIPE',
      stripePaymentIntentId: 'pi_x',
      providerReference: 'pi_x',
    });
    tipAllocationCount.mockResolvedValue(2);

    const result = await markTipPaidOut({
      tipId: 'tip-50',
      adminId: 'admin-1',
      paidOutMethod: 'ZELLE',
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('USE_ALLOCATION_SETTLE');
  });

  it('sole-beneficiary tip remains payable without allocations', () => {
    const flags = buildTipReconFlags({
      status: 'RECEIVED',
      beneficiaryCleanerId: 'cleaner-1',
      disputeStatus: 'NONE',
      refundedAt: null,
      needsReconcile: false,
      hasAllocations: false,
      owedAllocationCents: 0,
      allocatedCents: 0,
    });
    expect(flags.payable).toBe(true);
  });

  it('team tip payable via owed allocations', () => {
    expect(
      tipHasPayableAllocations({
        status: 'RECEIVED_UNATTRIBUTED',
        owedAllocationCents: 2500,
        disputeStatus: 'NONE',
        needsReconcile: false,
      })
    ).toBe(true);
    const flags = buildTipReconFlags({
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      disputeStatus: 'NONE',
      hasAllocations: true,
      owedAllocationCents: 2500,
      allocatedCents: 5000,
    });
    expect(flags.payable).toBe(true);
    expect(flags.missingBeneficiary).toBe(false);
  });

  it('refund before payout cancels OWED allocations', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-50',
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      amount: 5000,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
    });
    tipAllocationCount.mockResolvedValue(0);
    tipAllocationUpdateMany.mockResolvedValue({ count: 2 });
    tipUpdate.mockResolvedValue({});

    const result = await applyTipFullRefund({
      tipId: 'tip-50',
      stripeEventId: 'evt_ref_1',
      eventType: 'charge.refunded',
    });
    expect(result.ok).toBe(true);
    expect(tipAllocationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OWED' }),
        data: { status: 'CANCELLED' },
      })
    );
  });

  it('refund after partial allocation payout → needsReconcile', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-50',
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      amount: 5000,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
    });
    tipAllocationCount.mockResolvedValue(1);
    tipAllocationUpdateMany.mockResolvedValue({ count: 1 });
    tipUpdate.mockResolvedValue({});

    await applyTipFullRefund({
      tipId: 'tip-50',
      stripeEventId: 'evt_ref_2',
      eventType: 'charge.refunded',
    });
    expect(tipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          needsReconcile: true,
          reconcileReason: 'REFUND_AFTER_PAID_OUT',
        }),
      })
    );
  });

  it('cancelOwedTipAllocations is idempotent-friendly', async () => {
    tipAllocationUpdateMany.mockResolvedValue({ count: 0 });
    const n = await cancelOwedTipAllocations({
      tipId: 'tip-50',
      reason: 'test',
    });
    expect(n).toBe(0);
  });
});
