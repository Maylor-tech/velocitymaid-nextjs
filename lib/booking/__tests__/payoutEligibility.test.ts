import { describe, expect, it } from 'vitest';
import { computePayoutEligibility } from '../payoutEligibility';

describe('computePayoutEligibility', () => {
  it('does not say payout will be created after balance is paid when the job is already PAID', () => {
    const result = computePayoutEligibility({
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      assignedCleanerId: 'cleaner-1',
      JobPayout: null,
    });
    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/no payout record exists/i);
    expect(result.reason).not.toMatch(/after balance is paid/i);
  });

  it('uses the payout record status when one exists', () => {
    const result = computePayoutEligibility({
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      assignedCleanerId: 'cleaner-1',
      JobPayout: { id: 'po1', status: 'READY' },
    });
    expect(result.reason).toMatch(/payout ready/i);
  });
});
