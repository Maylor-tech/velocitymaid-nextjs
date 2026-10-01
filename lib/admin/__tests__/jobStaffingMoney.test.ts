import { describe, expect, it } from 'vitest';
import {
  deriveMoneyState,
  deriveStaffingState,
  type StaffingMoneyJob,
} from '@/lib/admin/jobStaffingMoney';

const base: StaffingMoneyJob = {
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  reviewStatus: 'PENDING',
  billingPolicy: 'PREPAY',
  assignedCleanerId: null,
  openOffer: null,
};

describe('deriveStaffingState — eligibility derives from isJobAssignable', () => {
  it('INVOICE_AFTER_SERVICE + PENDING is Ready to staff (payment does not gate)', () => {
    const s = deriveStaffingState({
      ...base,
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
    });
    expect(s.kind).toBe('ready_to_staff');
    expect(s.label).toBe('Ready to staff');
    expect(s.assignable).toBe(true);
    expect(s.urgent).toBe(true);
  });

  it('PREPAY unpaid stays blocked and is not urgent (money owns the urgency)', () => {
    const s = deriveStaffingState({
      ...base,
      billingPolicy: 'PREPAY',
      paymentStatus: 'PENDING',
    });
    expect(s.kind).toBe('blocked_payment');
    expect(s.assignable).toBe(false);
    expect(s.urgent).toBe(false);
  });

  it('PREPAY PAID becomes Ready to staff', () => {
    const s = deriveStaffingState({ ...base, paymentStatus: 'PAID' });
    expect(s.kind).toBe('ready_to_staff');
    expect(s.assignable).toBe(true);
  });

  it('PREPAY DEPOSIT_PAID + APPROVED review is Ready to staff', () => {
    const s = deriveStaffingState({
      ...base,
      paymentStatus: 'DEPOSIT_PAID',
      reviewStatus: 'APPROVED',
    });
    expect(s.kind).toBe('ready_to_staff');
    expect(s.assignable).toBe(true);
  });

  it('PREPAY DEPOSIT_PAID + PENDING review needs booking approval, not staffing', () => {
    const s = deriveStaffingState({
      ...base,
      paymentStatus: 'DEPOSIT_PAID',
      reviewStatus: 'PENDING',
    });
    expect(s.kind).toBe('needs_review');
    expect(s.assignable).toBe(false);
    expect(s.urgent).toBe(true);
  });

  it('an assigned cleaner reads Team assigned regardless of payment', () => {
    const prepaidUnpaidAssigned = deriveStaffingState({
      ...base,
      paymentStatus: 'PENDING',
      assignedCleanerId: 'cleaner-1',
    });
    expect(prepaidUnpaidAssigned.kind).toBe('staffed');
    expect(prepaidUnpaidAssigned.urgent).toBe(false);
  });

  it('terminal jobs never show staffing urgency', () => {
    for (const status of ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY']) {
      const s = deriveStaffingState({ ...base, status, assignedCleanerId: null });
      expect(s.kind).toBe('closed');
      expect(s.urgent).toBe(false);
    }
  });

  it('surfaces open and expired offers for assignable unassigned jobs', () => {
    const open = deriveStaffingState({
      ...base,
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      openOffer: {
        status: 'OFFERED',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        cleanerName: 'Dorottya',
      },
    });
    expect(open.kind).toBe('awaiting_offer');
    expect(open.label).toBe('Awaiting Dorottya');
    expect(open.urgent).toBe(false);

    const expired = deriveStaffingState({
      ...base,
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      openOffer: {
        status: 'OFFERED',
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        cleanerName: 'Dorottya',
      },
    });
    expect(expired.kind).toBe('offer_expired');
    expect(expired.urgent).toBe(true);
  });

  it('does not surface offers for a PREPAY-blocked job (payment gate wins)', () => {
    const s = deriveStaffingState({
      ...base,
      billingPolicy: 'PREPAY',
      paymentStatus: 'PENDING',
      openOffer: {
        status: 'OFFERED',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        cleanerName: 'Dorottya',
      },
    });
    expect(s.kind).toBe('blocked_payment');
  });
});

describe('deriveMoneyState — independent, policy-aware money read-out', () => {
  it('INVOICE_AFTER_SERVICE + PENDING reads "Invoice after service" while staffing is ready', () => {
    const job: StaffingMoneyJob = {
      ...base,
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
    };
    expect(deriveMoneyState(job).label).toBe('Invoice after service');
    expect(deriveMoneyState(job).tone).toBe('invoice');
    // Independence: same job is simultaneously ready to staff.
    expect(deriveStaffingState(job).kind).toBe('ready_to_staff');
  });

  it('PREPAY + PENDING reads "Payment required"', () => {
    const m = deriveMoneyState({
      ...base,
      billingPolicy: 'PREPAY',
      paymentStatus: 'PENDING',
    });
    expect(m.label).toBe('Payment required');
    expect(m.tone).toBe('due');
  });

  it('labels paid, deposit, balance, failed, refunded distinctly', () => {
    expect(deriveMoneyState({ ...base, paymentStatus: 'PAID' }).tone).toBe('paid');
    expect(deriveMoneyState({ ...base, paymentStatus: 'DEPOSIT_PAID' }).tone).toBe(
      'partial'
    );
    expect(deriveMoneyState({ ...base, paymentStatus: 'BALANCE_DUE' }).tone).toBe('due');
    expect(deriveMoneyState({ ...base, paymentStatus: 'FAILED' }).tone).toBe('failed');
    expect(deriveMoneyState({ ...base, paymentStatus: 'REFUNDED' }).tone).toBe(
      'refunded'
    );
  });

  it('money state never depends on service status', () => {
    const completed = deriveMoneyState({
      ...base,
      status: 'COMPLETED',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
    });
    const confirmed = deriveMoneyState({
      ...base,
      status: 'CONFIRMED',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
    });
    expect(completed.label).toBe(confirmed.label);
    expect(completed.tone).toBe(confirmed.tone);
  });
});
