import { describe, expect, it } from 'vitest';
import { planInvoicePaidJobPendingRepair } from '@/lib/invoices/invoiceJobPaymentMismatch';

describe('planInvoicePaidJobPendingRepair', () => {
  it('plans a payment-status repair and preserves the job price', () => {
    const plan = planInvoicePaidJobPendingRepair({
      invoiceStatus: 'PAID',
      invoiceAmountPaid: 500.63,
      invoiceBalanceDue: 0,
      jobPaymentStatus: 'PENDING',
      jobTotalPrice: 300,
    });

    expect(plan).toEqual({
      kind: 'repair',
      paymentStatus: 'PAID',
      amountPaid: 500.63,
      balanceDue: 0,
      preserveJobTotalPrice: 300,
      writes: ['paymentStatus', 'amountPaid', 'balanceDue'],
    });
    expect(plan).not.toHaveProperty('totalPrice');
    expect(plan).not.toHaveProperty('quotedTotal');
  });

  it('does not propose a write when the job is already PAID', () => {
    expect(
      planInvoicePaidJobPendingRepair({
        invoiceStatus: 'PAID',
        invoiceAmountPaid: 337.8,
        invoiceBalanceDue: 0,
        jobPaymentStatus: 'PAID',
        jobTotalPrice: 300,
      })
    ).toEqual({ kind: 'in_sync' });
  });

  it('leaves a refunded job alone', () => {
    const plan = planInvoicePaidJobPendingRepair({
      invoiceStatus: 'PAID',
      invoiceAmountPaid: 500.63,
      invoiceBalanceDue: 0,
      jobPaymentStatus: 'REFUNDED',
      jobTotalPrice: 300,
    });
    expect(plan.kind).toBe('out_of_scope');
  });
});
