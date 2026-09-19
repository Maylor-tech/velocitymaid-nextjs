import { describe, expect, it } from 'vitest';
import { JobStatus } from '@prisma/client';
import {
  isCancelledStatus,
  isCustomerCancellableStatus,
} from '@/lib/jobStatus';

/**
 * Mirrors ActionButtons canModify gating without mounting React.
 * Keeps customer-portal cancel visibility aligned with cancelCustomerJob.
 */
function canShowCustomerCancelActions(status: string): boolean {
  const upper = status.toUpperCase();
  return (
    isCustomerCancellableStatus(upper) &&
    !isCancelledStatus(upper) &&
    upper !== 'COMPLETED'
  );
}

describe('ActionButtons cancel visibility (status gating)', () => {
  it('shows cancel/modify for ASSIGNED and CONFIRMED', () => {
    expect(canShowCustomerCancelActions(JobStatus.ASSIGNED)).toBe(true);
    expect(canShowCustomerCancelActions('assigned')).toBe(true);
    expect(canShowCustomerCancelActions(JobStatus.CONFIRMED)).toBe(true);
    expect(canShowCustomerCancelActions(JobStatus.RECEIVED)).toBe(true);
  });

  it('hides cancel/modify for CANCELLED and in-service/terminal states', () => {
    expect(canShowCustomerCancelActions(JobStatus.CANCELLED)).toBe(false);
    expect(canShowCustomerCancelActions(JobStatus.CANCELLED_EMERGENCY)).toBe(
      false
    );
    expect(canShowCustomerCancelActions(JobStatus.COMPLETED)).toBe(false);
    expect(canShowCustomerCancelActions(JobStatus.ON_THE_WAY)).toBe(false);
    expect(canShowCustomerCancelActions(JobStatus.IN_PROGRESS)).toBe(false);
    expect(canShowCustomerCancelActions(JobStatus.AWAITING_QC)).toBe(false);
  });
});
