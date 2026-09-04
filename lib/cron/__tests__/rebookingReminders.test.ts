import { describe, expect, it } from 'vitest';
import {
  evaluateRebookingReminder,
  hasSendableCustomerEmail,
  rebookingCandidateWhere,
  type RebookingEvalJob,
} from '../rebookingReminders';

const checkoutStart = new Date('2026-09-11T00:00:00.000Z');
const checkoutEnd = new Date('2026-09-12T00:00:00.000Z');

function job(overrides: Partial<RebookingEvalJob> = {}): RebookingEvalJob {
  return {
    id: 'job-1',
    customerId: 'cust-1',
    preferredDate: new Date('2026-09-11T00:00:00.000Z'),
    status: 'COMPLETED',
    Customer: { email: 'host@example.com' },
    ...overrides,
  };
}

describe('rebookingCandidateWhere', () => {
  it('does not filter Customer.email with { not: null } (email is required in schema)', () => {
    const where = rebookingCandidateWhere(checkoutStart, checkoutEnd) as Record<
      string,
      unknown
    >;
    expect(where).not.toHaveProperty('Customer');
    expect(JSON.stringify(where)).not.toContain('not: null');
    expect(where.status).toEqual({
      notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'],
    });
  });
});

describe('evaluateRebookingReminder', () => {
  it('sends when the customer has an email and no skip conditions apply', () => {
    expect(
      evaluateRebookingReminder({
        job: job(),
        alreadyReminded: false,
        upcomingTurnoverScheduled: false,
      })
    ).toEqual({ send: true });
  });

  it('skips a customer without a sendable email', () => {
    expect(hasSendableCustomerEmail('')).toBe(false);
    expect(hasSendableCustomerEmail(undefined)).toBe(false);
    expect(
      evaluateRebookingReminder({
        job: job({ Customer: { email: '' } }),
        alreadyReminded: false,
        upcomingTurnoverScheduled: false,
      })
    ).toEqual({ send: false, skipReason: 'no-email' });
    expect(
      evaluateRebookingReminder({
        job: job({ Customer: null }),
        alreadyReminded: false,
        upcomingTurnoverScheduled: false,
      })
    ).toEqual({ send: false, skipReason: 'no-email' });
  });

  it('skips a cancelled job', () => {
    expect(
      evaluateRebookingReminder({
        job: job({ status: 'CANCELLED' }),
        alreadyReminded: false,
        upcomingTurnoverScheduled: false,
      })
    ).toEqual({ send: false, skipReason: 'cancelled' });
  });

  it('skips a job that already received a rebooking reminder', () => {
    expect(
      evaluateRebookingReminder({
        job: job(),
        alreadyReminded: true,
        upcomingTurnoverScheduled: false,
      })
    ).toEqual({ send: false, skipReason: 'already-reminded' });
  });

  it('skips when an upcoming turnover is already scheduled', () => {
    expect(
      evaluateRebookingReminder({
        job: job(),
        alreadyReminded: false,
        upcomingTurnoverScheduled: true,
      })
    ).toEqual({ send: false, skipReason: 'upcoming-turnover' });
  });
});
