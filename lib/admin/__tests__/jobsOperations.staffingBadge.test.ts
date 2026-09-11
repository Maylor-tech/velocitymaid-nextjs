import { describe, expect, it } from 'vitest';
import {
  getOpsListStaffingBadge,
  getStatusBadge,
} from '@/lib/admin/jobsOperations';

describe('getOpsListStaffingBadge', () => {
  it('does not show Cleaner needed for a cancelled unassigned job', () => {
    const badge = getOpsListStaffingBadge({
      status: 'CANCELLED',
      assignedCleanerId: null,
      openOffer: null,
    });
    expect(badge).toBeNull();
    expect(getStatusBadge('CANCELLED').label).toBe('Cancelled');
  });

  it('does not show staffing badges for CANCELLED_EMERGENCY or COMPLETED', () => {
    expect(
      getOpsListStaffingBadge({
        status: 'CANCELLED_EMERGENCY',
        assignedCleanerId: null,
        openOffer: null,
      })
    ).toBeNull();
    expect(
      getOpsListStaffingBadge({
        status: 'COMPLETED',
        assignedCleanerId: null,
        openOffer: null,
      })
    ).toBeNull();
  });

  it('still shows Cleaner needed for an active unassigned job', () => {
    const badge = getOpsListStaffingBadge({
      status: 'RECEIVED',
      assignedCleanerId: null,
      openOffer: null,
    });
    expect(badge).toEqual({
      kind: 'cleaner_needed',
      label: 'Cleaner needed',
      cls: 'bg-vm-warning-bg text-vm-warning',
    });
  });

  it('shows awaiting badge only while an offer is open on a non-terminal job', () => {
    const badge = getOpsListStaffingBadge({
      status: 'RECEIVED',
      assignedCleanerId: null,
      openOffer: {
        id: 'offer-1',
        status: 'OFFERED',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        cleanerName: 'Dorottya',
      },
    });
    expect(badge?.kind).toBe('awaiting');
    expect(badge?.label).toBe('Awaiting Dorottya');
  });
});
