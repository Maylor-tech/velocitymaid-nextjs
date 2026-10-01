import { describe, expect, it } from 'vitest';
import { getJobTriageReason } from '@/lib/admin/jobTriage';
import type { JobOperationsInput } from '@/lib/admin/jobsOperations';

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

describe('getJobTriageReason', () => {
  it('unassigned invoice-after-service, future → ready_to_staff', () => {
    expect(
      getJobTriageReason(
        job({ id: 'r', billingPolicy: 'INVOICE_AFTER_SERVICE', paymentStatus: 'PENDING' }),
        NOW
      ).kind
    ).toBe('ready_to_staff');
  });

  it('assigned invoice-after-service with outstanding money → invoice_after_service', () => {
    expect(
      getJobTriageReason(
        job({
          id: 'i',
          status: 'ASSIGNED',
          assignedCleanerId: 'cl1',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
          paymentStatus: 'PENDING',
        }),
        NOW
      ).kind
    ).toBe('invoice_after_service');
  });

  it('unpaid PREPAY → payment_required (blocked)', () => {
    expect(
      getJobTriageReason(
        job({ id: 'p', billingPolicy: 'PREPAY', paymentStatus: 'PENDING' }),
        NOW
      ).kind
    ).toBe('payment_required');
  });

  it('deposit paid + review pending → needs_booking_approval', () => {
    expect(
      getJobTriageReason(
        job({
          id: 'd',
          billingPolicy: 'PREPAY',
          paymentStatus: 'DEPOSIT_PAID',
          reviewStatus: 'PENDING',
        }),
        NOW
      ).kind
    ).toBe('needs_booking_approval');
  });

  it('completed unpaid → overdue_payment', () => {
    expect(
      getJobTriageReason(
        job({
          id: 'o',
          status: 'COMPLETED',
          paymentStatus: 'PENDING',
          completedAt: LONG_AGO,
          preferredDate: LONG_AGO,
          balanceDue: 100,
        }),
        NOW
      ).kind
    ).toBe('overdue_payment');
  });

  it('cancelled → closed', () => {
    expect(getJobTriageReason(job({ id: 'c', status: 'CANCELLED' }), NOW).kind).toBe('closed');
  });

  it('unassigned past-dated → past_stale', () => {
    expect(
      getJobTriageReason(
        job({ id: 's', assignedCleanerId: null, preferredDate: PAST, paymentStatus: 'PAID' }),
        NOW
      ).kind
    ).toBe('past_stale');
  });

  it('isJobAssignable is the staffing authority: same inputs, policy flips ready vs blocked', () => {
    const base = { id: 'auth', paymentStatus: 'PENDING', preferredDate: FUTURE } as const;
    expect(getJobTriageReason(job({ ...base, billingPolicy: 'INVOICE_AFTER_SERVICE' }), NOW).kind).toBe(
      'ready_to_staff'
    );
    expect(getJobTriageReason(job({ ...base, billingPolicy: 'PREPAY' }), NOW).kind).toBe(
      'payment_required'
    );
  });

  it('never surfaces staffing action for a terminal job (independence preserved)', () => {
    // Cancelled job that is unpaid must not read as "payment required"/"ready".
    const reason = getJobTriageReason(
      job({ id: 't', status: 'CANCELLED', paymentStatus: 'PENDING', billingPolicy: 'PREPAY' }),
      NOW
    );
    expect(reason.kind).toBe('closed');
  });
});
