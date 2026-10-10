import { describe, expect, it } from 'vitest';
import {
  resolveInvoiceCollection,
  resolveJobBalanceCollection,
} from '../authorizedCollection';
import { ELIZABETH_K_PHASE2 } from '../elizabethKPhase2';
import { canShowPayBalance } from '@/lib/booking/payBalanceVisibility';
import { isInvoiceOpenForPayment } from '@/lib/customer/invoicePay';

const draft400 = {
  status: 'DRAFT',
  total: 400,
  amountPaid: 0,
  balanceDue: 400,
};

const sentAfterCredit = {
  status: 'SENT',
  total: 250,
  amountPaid: 25,
  balanceDue: 225,
};

describe('authorizedCollection — scoped to invalid Elizabeth K leftover', () => {
  it('blocks this job\'s $400 leftover on job-balance and invoice checkout', () => {
    expect(
      resolveJobBalanceCollection({
        jobId: ELIZABETH_K_PHASE2.jobId,
        jobBalanceDue: 400,
        invoice: draft400,
      }).code
    ).toBe('ELIZABETH_K_PHASE2_HOLD');
    expect(
      resolveInvoiceCollection({
        jobId: ELIZABETH_K_PHASE2.jobId,
        invoice: draft400,
      }).code
    ).toBe('ELIZABETH_K_PHASE2_HOLD');
  });

  it('does not block an unrelated PREPAY job-balance, even with a linked invoice', () => {
    const decision = resolveJobBalanceCollection({
      jobId: 'other-job',
      jobBalanceDue: 240,
      invoice: { status: 'DRAFT', total: 265, amountPaid: 25, balanceDue: 240 },
    });
    expect(decision.allowed).toBe(true);
    expect(decision.amount).toBe(240);
  });

  it('does not block an unrelated DRAFT invoice checkout (Incident #001)', () => {
    const decision = resolveInvoiceCollection({
      jobId: 'other-job',
      invoice: { status: 'DRAFT', total: 225, amountPaid: 0, balanceDue: 225 },
    });
    expect(decision.allowed).toBe(true);
    expect(decision.amount).toBe(225);
  });

  it('blocks the intermediate $250 invoice and leftover $400 job after Phase 2A, before credit', () => {
    const draft250 = { status: 'DRAFT', total: 250, amountPaid: 0, balanceDue: 250 };
    expect(
      resolveInvoiceCollection({
        jobId: ELIZABETH_K_PHASE2.jobId,
        invoice: draft250,
      })
    ).toMatchObject({ allowed: false, code: 'ELIZABETH_K_PHASE2_HOLD' });
    expect(
      resolveJobBalanceCollection({
        jobId: ELIZABETH_K_PHASE2.jobId,
        jobBalanceDue: 400,
        invoice: draft250,
      })
    ).toMatchObject({ allowed: false, code: 'ELIZABETH_K_PHASE2_HOLD' });
  });

  it('aligns issued checkout to $225 after the authorized price and deposit credit', () => {
    const decision = resolveInvoiceCollection({
      jobId: ELIZABETH_K_PHASE2.jobId,
      invoice: sentAfterCredit,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.amount).toBe(225);
  });

  it('blocks an issued $400 leftover invoice on this job only', () => {
    expect(
      resolveInvoiceCollection({
        jobId: ELIZABETH_K_PHASE2.jobId,
        invoice: { status: 'SENT', total: 400, amountPaid: 0, balanceDue: 400 },
      }).code
    ).toBe('ELIZABETH_K_PHASE2_HOLD');
    expect(
      resolveInvoiceCollection({
        jobId: 'other-job',
        invoice: { status: 'SENT', total: 400, amountPaid: 0, balanceDue: 400 },
      }).allowed
    ).toBe(true);
  });

  it('hides Pay Remaining only for this job\'s $400 leftover', () => {
    expect(
      canShowPayBalance({
        id: ELIZABETH_K_PHASE2.jobId,
        status: 'COMPLETED',
        paymentStatus: 'BALANCE_DUE',
        balanceDue: 400,
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
    expect(
      canShowPayBalance({
        id: 'other-job',
        status: 'COMPLETED',
        paymentStatus: 'BALANCE_DUE',
        balanceDue: 240,
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
    expect(isInvoiceOpenForPayment({ status: 'DRAFT', balanceDue: 225 })).toBe(true);
    expect(isInvoiceOpenForPayment({ status: 'SENT', balanceDue: 225 })).toBe(true);
  });
});
