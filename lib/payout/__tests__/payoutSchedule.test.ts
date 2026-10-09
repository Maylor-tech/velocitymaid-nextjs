import { describe, expect, it } from 'vitest';
import {
  CLEANER_PAYOUT_WEEKDAY,
  cleanerPayoutTimingCopy,
  nextWeeklyPayoutDate,
} from '../payoutSchedule';

describe('payoutSchedule', () => {
  it('uses Friday as the weekly pay day', () => {
    expect(CLEANER_PAYOUT_WEEKDAY).toBe(5);
  });

  it('returns the next Friday after a Monday', () => {
    const monday = new Date(2026, 9, 5, 12, 0, 0, 0);
    expect(monday.getDay()).toBe(1);
    const next = nextWeeklyPayoutDate(monday);
    expect(next.getDay()).toBe(5);
    expect(next.getDate()).toBe(9);
    expect(next.getMonth()).toBe(9);
  });

  it('skips the current Friday so a Friday completion lands on the following week', () => {
    const friday = new Date(2026, 9, 9, 12, 0, 0, 0);
    expect(friday.getDay()).toBe(5);
    const next = nextWeeklyPayoutDate(friday);
    expect(next.getDay()).toBe(5);
    expect(next.getDate()).toBe(16);
  });

  it('describes READY payouts with an expected Friday', () => {
    const copy = cleanerPayoutTimingCopy({
      status: 'READY',
      from: new Date(2026, 9, 5, 12, 0, 0, 0),
    });
    expect(copy).toMatch(/^Expected Friday/);
  });

  it('describes PAID payouts with the paid date', () => {
    const copy = cleanerPayoutTimingCopy({
      status: 'PAID',
      paidAt: new Date(2026, 9, 2, 16, 0, 0, 0),
    });
    expect(copy).toMatch(/^Paid Friday/);
  });
});
