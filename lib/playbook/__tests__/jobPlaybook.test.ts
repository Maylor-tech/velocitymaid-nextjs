import { describe, it, expect } from 'vitest';
import { buildJobPlaybook, type PlaybookJob } from '../jobPlaybook';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const IMMINENT = '2026-10-02'; // tomorrow
const FAR = '2026-10-20'; // ~3 weeks out

const completeProperty = {
  accessType: 'LOCKBOX',
  standingInstructions: 'Reset for next guest.',
};

describe('buildJobPlaybook', () => {
  it('PREPAY unpaid + imminent → collect payment NOW, never ready to staff', () => {
    const job: PlaybookJob = {
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      billingPolicy: 'PREPAY',
      preferredDate: IMMINENT,
      property: completeProperty,
    };
    const pb = buildJobPlaybook(job, NOW);
    expect(pb.steps.map((s) => s.id)).toContain('collect-payment');
    expect(pb.steps.find((s) => s.id === 'collect-payment')?.priority).toBe('now');
    expect(pb.steps.map((s) => s.id)).not.toContain('assign-cleaner');
    expect(pb.urgentCount).toBe(1);
  });

  it('PREPAY unpaid + far out → collect payment is SOON, not urgent', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        billingPolicy: 'PREPAY',
        preferredDate: FAR,
      },
      NOW
    );
    expect(pb.steps.find((s) => s.id === 'collect-payment')?.priority).toBe('soon');
    expect(pb.urgentCount).toBe(0);
  });

  it('INVOICE_AFTER_SERVICE + PENDING + imminent, unassigned → assign NOW, no money alarm', () => {
    const pb = buildJobPlaybook(
      {
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: IMMINENT,
        property: completeProperty,
      },
      NOW
    );
    expect(pb.headline).toBe('Assign a cleaner');
    expect(pb.steps.map((s) => s.id)).toEqual(['assign-cleaner']);
    expect(pb.steps[0].priority).toBe('now');
  });

  it('INVOICE_AFTER_SERVICE + PENDING + far out → assign SOON', () => {
    const pb = buildJobPlaybook(
      {
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: FAR,
        property: completeProperty,
      },
      NOW
    );
    expect(pb.steps.find((s) => s.id === 'assign-cleaner')?.priority).toBe('soon');
    expect(pb.urgentCount).toBe(0);
  });

  it('assigned + complete brief + paid → all clear', () => {
    const pb = buildJobPlaybook(
      {
        status: 'ASSIGNED',
        paymentStatus: 'PAID',
        billingPolicy: 'PREPAY',
        assignedCleanerId: 'cl_1',
        preferredDate: IMMINENT,
        property: completeProperty,
      },
      NOW
    );
    expect(pb.steps).toHaveLength(0);
    expect(pb.headline).toBe('No action needed right now');
  });

  it('ready to staff + incomplete brief (missing access) + imminent → assign AND complete brief, both now', () => {
    const pb = buildJobPlaybook(
      {
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: IMMINENT,
        property: { accessType: null, standingInstructions: 'Reset.' },
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toEqual(
      expect.arrayContaining(['assign-cleaner', 'complete-brief'])
    );
    expect(pb.urgentCount).toBe(2);
    expect(pb.steps.find((s) => s.id === 'complete-brief')?.detail).toContain(
      'access method'
    );
  });

  it('deposit paid + review pending (PREPAY) → approve booking NOW', () => {
    const pb = buildJobPlaybook(
      {
        status: 'RECEIVED',
        paymentStatus: 'DEPOSIT_PAID',
        reviewStatus: 'PENDING',
        billingPolicy: 'PREPAY',
        preferredDate: FAR,
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toEqual(['approve-booking']);
    expect(pb.steps[0].priority).toBe('now');
  });

  it('expired offer → re-staff NOW', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: FAR,
        property: completeProperty,
        openOffer: { status: 'EXPIRED', expiresAt: '2020-01-01T00:00:00.000Z' },
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toContain('restaff');
    expect(pb.steps.find((s) => s.id === 'restaff')?.priority).toBe('now');
  });

  it('completed + invoice-after-service + unpaid → send invoice NOW, no staffing step', () => {
    const pb = buildJobPlaybook(
      {
        status: 'COMPLETED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        completedAt: NOW,
        preferredDate: '2026-09-28',
        property: completeProperty,
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toEqual(['send-invoice']);
    expect(pb.steps[0].priority).toBe('now');
  });

  it('cancelled job → no urgency, all clear', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
        billingPolicy: 'PREPAY',
        preferredDate: IMMINENT,
      },
      NOW
    );
    expect(pb.steps).toHaveLength(0);
    expect(pb.urgentCount).toBe(0);
  });

  it('failed payment → surfaces payment-failed NOW', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CONFIRMED',
        paymentStatus: 'FAILED',
        billingPolicy: 'PREPAY',
        preferredDate: IMMINENT,
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toContain('payment-failed');
    expect(pb.steps.find((s) => s.id === 'payment-failed')?.priority).toBe('now');
  });

  it('assigned + balance due → collect balance SOON only', () => {
    const pb = buildJobPlaybook(
      {
        status: 'IN_PROGRESS',
        paymentStatus: 'BALANCE_DUE',
        billingPolicy: 'PREPAY',
        assignedCleanerId: 'cl_1',
        preferredDate: NOW,
        property: completeProperty,
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toEqual(['collect-balance']);
    expect(pb.steps[0].priority).toBe('soon');
    expect(pb.headline).toBe('Collect the balance due');
  });

  it('awaiting open offer → informational LATER, not urgent', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: FAR,
        property: completeProperty,
        openOffer: { status: 'OFFERED', expiresAt: '2999-01-01T00:00:00.000Z' },
      },
      NOW
    );
    expect(pb.steps.map((s) => s.id)).toEqual(['awaiting-offer']);
    expect(pb.steps[0].priority).toBe('later');
    expect(pb.urgentCount).toBe(0);
  });

  it('orders steps now → soon → later', () => {
    const pb = buildJobPlaybook(
      {
        status: 'CONFIRMED',
        paymentStatus: 'BALANCE_DUE',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        preferredDate: FAR,
        property: completeProperty,
        openOffer: { status: 'OFFERED', expiresAt: '2999-01-01T00:00:00.000Z' },
      },
      NOW
    );
    // collect-balance (soon) must come before awaiting-offer (later)
    expect(pb.steps.map((s) => s.id)).toEqual(['collect-balance', 'awaiting-offer']);
  });
});
