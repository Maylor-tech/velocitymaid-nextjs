import { describe, expect, it } from 'vitest';
import { PAYOUT_RULES, calcPayout } from '@/lib/payoutRules';
import {
  RECRUITMENT_CLEANER_PCT,
  RECRUITMENT_PAY_HEADING,
  RECRUITMENT_PAY_OFFER_COPY,
  RECRUITMENT_PAY_SCHEDULE_COPY,
} from '@/lib/marketing/recruitmentPayCopy';

describe('recruitmentPayCopy', () => {
  it('uses the same 65% as calcPayout on the eligible job amount', () => {
    expect(RECRUITMENT_CLEANER_PCT).toBe(Math.round(PAYOUT_RULES.cleanerPct * 100));
    expect(RECRUITMENT_CLEANER_PCT).toBe(65);
    expect(RECRUITMENT_PAY_HEADING).toBe('65% of the eligible job amount');
    expect(calcPayout(225).cleanerAmount).toBe(146.25);
  });

  it('describes dispatch offers, not a blanket assign-after-accept rule', () => {
    expect(RECRUITMENT_PAY_OFFER_COPY).toMatch(/Offered jobs/);
    expect(RECRUITMENT_PAY_OFFER_COPY).toMatch(/before you accept/);
    expect(RECRUITMENT_PAY_OFFER_COPY).not.toMatch(/Nothing is assigned/);
  });

  it('names Friday as the weekly pay day', () => {
    expect(RECRUITMENT_PAY_SCHEDULE_COPY).toMatch(/Fridays/);
    expect(RECRUITMENT_PAY_SCHEDULE_COPY).not.toMatch(/weekly cycle/);
  });
});
