import { describe, expect, it, vi } from 'vitest';
import { InvoiceStatus } from '@prisma/client';
import {
  NOT_RECORDED,
  UNAVAILABLE,
  computeOwnerProfitability,
  isCleanerPayoutPaid,
  isCleanerPayoutPayable,
  loadOwnerProfitability,
} from '../ownerProfitabilityReadModel';

const vtScope = {
  mode: 'branch' as const,
  branchId: 'branch-vt',
  branchName: 'Vermont',
};

describe('ownerProfitabilityReadModel — $300 Vermont acceptance', () => {
  it('fully paid invoice + READY payout: collected $300, payable $195, share $105 is not profit', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        {
          id: 'inv-1',
          total: 300,
          balanceDue: 0,
          status: InvoiceStatus.PAID,
        },
      ],
      payments: [{ amount: 300, invoiceId: 'inv-1' }],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'READY',
          paidAt: null,
        },
      ],
    });

    expect(snap.primary.invoicedRevenue).toBe(300);
    expect(snap.primary.collectedRevenue).toBe(300);
    expect(snap.primary.outstandingAr).toBe(0);
    expect(snap.primary.cleanerPayable).toBe(195);
    expect(snap.primary.cleanerPaid).toBe(0);
    expect(snap.primary.platformGrossShare).toBe(105);
    expect(snap.secondary.processingCost).toBeNull();
    expect(snap.secondary.processingCostLabel).toBe(NOT_RECORDED);
    expect(snap.secondary.directJobCosts).toBeNull();
    expect(snap.secondary.directJobCostsLabel).toBe(NOT_RECORDED);
    expect(snap.secondary.contributionProfit).toBeNull();
    expect(snap.secondary.contributionProfitLabel).toBe(UNAVAILABLE);
    expect(snap.secondary.contributionMargin).toBeNull();
    expect(snap.secondary.costsComplete).toBe(false);
    expect(snap.disclaimer).toContain('Platform gross share is not profit');
  });

  it('invoiced but unpaid + cleaner payable: must not claim collected', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        {
          id: 'inv-2',
          total: 300,
          balanceDue: 300,
          status: InvoiceStatus.SENT,
        },
      ],
      payments: [],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'READY',
          paidAt: null,
        },
      ],
    });

    expect(snap.primary.invoicedRevenue).toBe(300);
    expect(snap.primary.collectedRevenue).toBe(0);
    expect(snap.primary.outstandingAr).toBe(300);
    expect(snap.primary.cleanerPayable).toBe(195);
  });

  it('partial payment', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        {
          id: 'inv-3',
          total: 300,
          balanceDue: 100,
          status: InvoiceStatus.PARTIALLY_PAID,
        },
      ],
      payments: [
        { amount: 150, invoiceId: 'inv-3' },
        { amount: 50, invoiceId: 'inv-3' },
      ],
      payouts: [],
    });

    expect(snap.primary.invoicedRevenue).toBe(300);
    expect(snap.primary.collectedRevenue).toBe(200);
    expect(snap.primary.outstandingAr).toBe(100);
  });
});

describe('ownerProfitabilityReadModel — invoice and payout variants', () => {
  it('excludes DRAFT from invoiced revenue but reports draftInvoicedTotal', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        { id: 'd1', total: 300, balanceDue: 300, status: InvoiceStatus.DRAFT },
        { id: 's1', total: 200, balanceDue: 200, status: InvoiceStatus.SENT },
      ],
      payments: [],
      payouts: [],
    });
    expect(snap.primary.invoicedRevenue).toBe(200);
    expect(snap.primary.draftInvoicedTotal).toBe(300);
    expect(snap.primary.outstandingAr).toBe(200);
  });

  it('invoice-after-service: payable before collection', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        { id: 'ias', total: 300, balanceDue: 300, status: InvoiceStatus.DRAFT },
      ],
      payments: [],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'READY',
          paidAt: null,
        },
      ],
    });
    expect(snap.primary.invoicedRevenue).toBe(0);
    expect(snap.primary.draftInvoicedTotal).toBe(300);
    expect(snap.primary.collectedRevenue).toBe(0);
    expect(snap.primary.cleanerPayable).toBe(195);
  });

  it('PAID payout moves amount from payable to paid', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [],
      payments: [],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'PAID',
          paidAt: new Date('2026-09-01'),
        },
      ],
    });
    expect(snap.primary.cleanerPayable).toBe(0);
    expect(snap.primary.cleanerPaid).toBe(195);
    expect(snap.primary.platformGrossShare).toBe(105);
  });

  it('treats paidAt as paid even if status string lags', () => {
    expect(
      isCleanerPayoutPaid({ status: 'SENT', paidAt: new Date() })
    ).toBe(true);
    expect(
      isCleanerPayoutPayable({ status: 'SENT', paidAt: new Date() })
    ).toBe(false);
  });

  it('READY / PENDING / APPROVED / SENT without paidAt are payable', () => {
    for (const status of ['READY', 'PENDING', 'APPROVED', 'SENT']) {
      expect(isCleanerPayoutPayable({ status, paidAt: null })).toBe(true);
    }
  });

  it('CANCELLED / FAILED payouts are neither payable nor paid', () => {
    for (const status of ['CANCELLED', 'FAILED', 'VOID']) {
      expect(isCleanerPayoutPayable({ status, paidAt: null })).toBe(false);
      expect(isCleanerPayoutPaid({ status, paidAt: null })).toBe(false);
    }
  });

  it('missing invoice and missing JobPayout yield zeros', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [],
      payments: [],
      payouts: [],
    });
    expect(snap.primary).toEqual({
      invoicedRevenue: 0,
      draftInvoicedTotal: 0,
      collectedRevenue: 0,
      outstandingAr: 0,
      cleanerPayable: 0,
      cleanerPaid: 0,
      platformGrossShare: 0,
    });
  });

  it('Stripe and manual payment methods both count as collected (amount only)', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [
        { id: 'inv', total: 300, balanceDue: 0, status: InvoiceStatus.PAID },
      ],
      payments: [
        { amount: 200, invoiceId: 'inv' },
        { amount: 100, invoiceId: 'inv' },
      ],
      payouts: [],
    });
    expect(snap.primary.collectedRevenue).toBe(300);
  });

  it('accepted-offer and fallback payouts both contribute platformGrossShare from platformFee', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [],
      payments: [],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'READY',
          paidAt: null,
        },
        {
          cleanerAmount: 130,
          platformFee: 70,
          status: 'READY',
          paidAt: null,
        },
      ],
    });
    expect(snap.primary.cleanerPayable).toBe(325);
    expect(snap.primary.platformGrossShare).toBe(175);
  });

  it('is deterministic across repeated calls', () => {
    const input = {
      scope: vtScope,
      invoices: [
        { id: 'inv', total: 300, balanceDue: 0, status: InvoiceStatus.PAID },
      ],
      payments: [{ amount: 300, invoiceId: 'inv' }],
      payouts: [
        {
          cleanerAmount: 195,
          platformFee: 105,
          status: 'READY',
          paidAt: null,
        },
      ],
    };
    const a = computeOwnerProfitability(input);
    const b = computeOwnerProfitability(input);
    expect(a).toEqual(b);
  });

  it('never invents processing fee or expenses', () => {
    const snap = computeOwnerProfitability({
      scope: vtScope,
      invoices: [],
      payments: [],
      payouts: [],
    });
    expect(snap.secondary.processingCost).toBeNull();
    expect(snap.secondary.directJobCosts).toBeNull();
    expect(snap.secondary.contributionProfit).toBeNull();
  });
});

describe('loadOwnerProfitability — branch isolation + read-only', () => {
  it('scopes Invoice / JobPayout queries to branchId and never writes', async () => {
    const invoiceFindMany = vi.fn().mockResolvedValue([
      { id: 'inv-vt', total: 300, balanceDue: 0, status: InvoiceStatus.PAID },
    ]);
    const paymentFindMany = vi.fn().mockResolvedValue([
      { amount: 300, invoiceId: 'inv-vt' },
    ]);
    const payoutFindMany = vi.fn().mockResolvedValue([
      {
        cleanerAmount: 195,
        platformFee: 105,
        status: 'READY',
        paidAt: null,
      },
    ]);
    const create = vi.fn();
    const update = vi.fn();
    const updateMany = vi.fn();

    const db = {
      invoice: { findMany: invoiceFindMany, create, update, updateMany },
      invoicePayment: { findMany: paymentFindMany, create, update },
      jobPayout: { findMany: payoutFindMany, create, update },
      receipt: { create },
      cleanerBalanceLedger: { create },
      job: { update },
      customer: { update },
    };

    const snap = await loadOwnerProfitability(db as never, {
      branchId: 'branch-vt',
      branchName: 'Vermont',
    });

    expect(snap.scope.mode).toBe('branch');
    expect(snap.scope.branchId).toBe('branch-vt');
    expect(snap.primary.invoicedRevenue).toBe(300);
    expect(snap.primary.collectedRevenue).toBe(300);
    expect(snap.primary.cleanerPayable).toBe(195);

    expect(invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { Job: { branchId: 'branch-vt' } },
          ]),
        }),
      })
    );
    expect(payoutFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { branchId: 'branch-vt' },
      })
    );

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('global mode omits branch filter on payouts', async () => {
    const invoiceFindMany = vi.fn().mockResolvedValue([]);
    const payoutFindMany = vi.fn().mockResolvedValue([]);
    const db = {
      invoice: { findMany: invoiceFindMany },
      invoicePayment: { findMany: vi.fn() },
      jobPayout: { findMany: payoutFindMany },
    };

    const snap = await loadOwnerProfitability(db as never, { branchId: null });
    expect(snap.scope.mode).toBe('global');
    expect(payoutFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(invoiceFindMany.mock.calls[0][0].where.OR).toBeUndefined();
  });

  it('Vermont query shape cannot match NJ/Jamaica branch ids', async () => {
    const invoiceFindMany = vi.fn().mockResolvedValue([]);
    const payoutFindMany = vi.fn().mockResolvedValue([]);
    const db = {
      invoice: { findMany: invoiceFindMany },
      invoicePayment: { findMany: vi.fn() },
      jobPayout: { findMany: payoutFindMany },
    };

    await loadOwnerProfitability(db as never, { branchId: 'branch-vt' });

    const invoiceWhere = invoiceFindMany.mock.calls[0][0].where;
    const payoutWhere = payoutFindMany.mock.calls[0][0].where;
    expect(JSON.stringify(invoiceWhere)).toContain('branch-vt');
    expect(JSON.stringify(invoiceWhere)).not.toContain('branch-nj');
    expect(JSON.stringify(invoiceWhere)).not.toContain('jamaica');
    expect(payoutWhere).toEqual({ branchId: 'branch-vt' });
  });
});
