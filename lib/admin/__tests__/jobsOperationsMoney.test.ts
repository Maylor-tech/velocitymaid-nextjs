import { describe, expect, it } from 'vitest';
import {
  classifyJobPayment,
  computePaymentBuckets,
  computeNeedsAttentionBreakdown,
  isActiveUnassigned,
  isIncompleteChecklist,
  isStaleUnassigned,
  type JobOperationsInput,
} from '@/lib/admin/jobsOperations';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const FUTURE = '2026-12-20T12:00:00.000Z';
const PAST = '2026-09-20T12:00:00.000Z';
const LONG_AGO = '2026-09-01T12:00:00.000Z';

function job(overrides: Partial<JobOperationsInput> & { id: string }): JobOperationsInput {
  return {
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    preferredDate: FUTURE,
    ...overrides,
  };
}

describe('classifyJobPayment', () => {
  it('invoice-after-service PENDING before service is NOT cash due', () => {
    expect(
      classifyJobPayment(
        job({
          id: 'ias',
          paymentStatus: 'PENDING',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
          preferredDate: FUTURE,
        }),
        NOW
      )
    ).toBe('invoice_after_service');
  });

  it('classifies unpaid PREPAY as prepay_pending (separate from cash due)', () => {
    expect(
      classifyJobPayment(
        job({ id: 'prepay', paymentStatus: 'PENDING', billingPolicy: 'PREPAY', preferredDate: FUTURE }),
        NOW
      )
    ).toBe('prepay_pending');
  });

  it('classifies a completed unpaid job as cash_due', () => {
    expect(
      classifyJobPayment(
        job({
          id: 'done',
          status: 'COMPLETED',
          paymentStatus: 'PENDING',
          completedAt: LONG_AGO,
          preferredDate: LONG_AGO,
          balanceDue: 100,
        }),
        NOW
      )
    ).toBe('cash_due');
  });

  it('treats past-dated unpaid (even invoice-after-service) as cash_due/overdue', () => {
    expect(
      classifyJobPayment(
        job({
          id: 'late-ias',
          paymentStatus: 'PENDING',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
          preferredDate: PAST,
        }),
        NOW
      )
    ).toBe('cash_due');
  });

  it('BALANCE_DUE is cash_due; PAID is none', () => {
    expect(classifyJobPayment(job({ id: 'bal', paymentStatus: 'BALANCE_DUE', balanceDue: 50 }), NOW)).toBe(
      'cash_due'
    );
    expect(classifyJobPayment(job({ id: 'paid', paymentStatus: 'PAID' }), NOW)).toBe('none');
  });
});

describe('computePaymentBuckets', () => {
  it('separates cash due / invoice-after-service / prepay and folds invoices into cash due', () => {
    const jobs: JobOperationsInput[] = [
      job({
        id: 'ias',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: FUTURE,
        balanceDue: 50,
      }),
      job({
        id: 'prepay',
        paymentStatus: 'PENDING',
        billingPolicy: 'PREPAY',
        preferredDate: FUTURE,
        balanceDue: 75,
      }),
      job({
        id: 'overdue',
        status: 'COMPLETED',
        paymentStatus: 'PENDING',
        completedAt: LONG_AGO,
        preferredDate: LONG_AGO,
        balanceDue: 100,
      }),
    ];
    const buckets = computePaymentBuckets(jobs, 225, 1, NOW);
    expect(buckets.cashDue).toEqual({ amount: 325, count: 2 }); // 100 job + 225 invoice, 1 job + 1 invoice
    expect(buckets.invoiceAfterService).toEqual({ amount: 50, count: 1 });
    expect(buckets.prepayPending).toEqual({ amount: 75, count: 1 });
  });
});

describe('isIncompleteChecklist excludes terminal jobs', () => {
  it('does not flag completed or cancelled jobs', () => {
    expect(
      isIncompleteChecklist(job({ id: 'c', status: 'COMPLETED', checklistTotal: 50, checklistCompleted: 30 }))
    ).toBe(false);
    expect(
      isIncompleteChecklist(job({ id: 'x', status: 'CANCELLED', checklistTotal: 50, checklistCompleted: 0 }))
    ).toBe(false);
  });

  it('still flags an in-progress job with a partial checklist', () => {
    expect(
      isIncompleteChecklist(
        job({ id: 'p', status: 'IN_PROGRESS', checklistTotal: 50, checklistCompleted: 30 })
      )
    ).toBe(true);
  });
});

describe('active vs stale unassigned (current-action window)', () => {
  it('active = unassigned within window; stale = unassigned past-dated', () => {
    const future = job({ id: 'f', status: 'CONFIRMED', assignedCleanerId: null, preferredDate: FUTURE });
    const stale = job({ id: 's', status: 'CONFIRMED', assignedCleanerId: null, preferredDate: PAST });
    expect(isActiveUnassigned(future, NOW)).toBe(true);
    expect(isStaleUnassigned(future, NOW)).toBe(false);
    expect(isActiveUnassigned(stale, NOW)).toBe(false);
    expect(isStaleUnassigned(stale, NOW)).toBe(true);
  });

  it('breakdown keeps stale past-dated jobs out of active staffing demand', () => {
    const breakdown = computeNeedsAttentionBreakdown(
      [
        job({ id: 'f', status: 'CONFIRMED', assignedCleanerId: null, preferredDate: FUTURE }),
        job({ id: 's', status: 'CONFIRMED', assignedCleanerId: null, preferredDate: PAST }),
      ],
      NOW
    );
    expect(breakdown.unassigned).toBe(1);
    expect(breakdown.staleUnassigned).toBe(1);
  });
});
