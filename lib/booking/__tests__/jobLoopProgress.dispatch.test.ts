import { describe, expect, it } from 'vitest';
import { getJobLoopProgress } from '../jobLoopProgress';

const assignable = {
  status: 'RECEIVED',
  paymentStatus: 'PENDING',
  reviewStatus: 'APPROVED',
  assignedCleanerId: null,
  billingPolicy: 'INVOICE_AFTER_SERVICE',
};

describe('job-loop copy when dispatch is enabled', () => {
  it('replaces Assign Cleaner with Send offer when no offer exists', () => {
    const loop = getJobLoopProgress('job-1', {
      ...assignable,
      dispatchOffersEnabled: true,
      dispatchState: 'CLEANER_NEEDED',
    });
    expect(loop.label).toBe('Cleaner needed');
    expect(loop.nextAction).toMatch(/Send offer/);
    expect(loop.nextAction).not.toMatch(/Assign Cleaner/);
  });

  it('shows awaiting cleaner response when an active offer exists', () => {
    const loop = getJobLoopProgress('job-1', {
      ...assignable,
      dispatchOffersEnabled: true,
      dispatchState: 'OFFER_SENT',
    });
    expect(loop.label).toBe('Awaiting cleaner response');
    expect(loop.nextAction).toMatch(/outstanding/i);
  });

  it('shows cleaner needed after decline', () => {
    const loop = getJobLoopProgress('job-1', {
      ...assignable,
      dispatchOffersEnabled: true,
      dispatchState: 'DECLINED',
    });
    expect(loop.label).toBe('Cleaner needed');
    expect(loop.nextAction).toMatch(/previous offer ended/i);
  });

  it('shows cleaner needed after expiry', () => {
    const loop = getJobLoopProgress('job-1', {
      ...assignable,
      dispatchOffersEnabled: true,
      dispatchState: 'EXPIRED',
    });
    expect(loop.label).toBe('Cleaner needed');
    expect(loop.nextAction).toMatch(/send a new offer/i);
  });

  it('keeps Assign Cleaner copy when dispatch is off', () => {
    const loop = getJobLoopProgress('job-1', {
      ...assignable,
      dispatchOffersEnabled: false,
    });
    expect(loop.label).toBe('Ready to assign');
    expect(loop.nextAction).toMatch(/Assign Cleaner/);
  });
});
