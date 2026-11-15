import { describe, expect, it } from 'vitest';
import { resolveWorkspacePresentation } from '../jobsWorkspacePresentation';

const NOW = new Date('2027-01-15T15:00:00Z');

describe('resolveWorkspacePresentation', () => {
  it('prioritizes Review request for RECEIVED', () => {
    const p = resolveWorkspacePresentation(
      { id: '1', status: 'RECEIVED', preferredDate: '2027-01-20T00:00:00.000Z' },
      NOW
    );
    expect(p.primaryActionLabel).toBe('Review request');
    expect(p.staffingState).toBe('review_request');
  });

  it('flags ASSIGNED without cleaner as assignment needs review', () => {
    const p = resolveWorkspacePresentation(
      {
        id: '2',
        status: 'ASSIGNED',
        preferredDate: '2027-01-20T00:00:00.000Z',
        assignedCleanerId: null,
      },
      NOW
    );
    expect(p.staffingState).toBe('assignment_needs_review');
    expect(p.primaryActionLabel).toBe('Review assignment');
  });

  it('shows Needs cleaner for future CONFIRMED without cleaner', () => {
    const p = resolveWorkspacePresentation(
      {
        id: '3',
        status: 'CONFIRMED',
        preferredDate: '2027-01-20T00:00:00.000Z',
        assignedCleanerId: null,
      },
      NOW
    );
    expect(p.staffingState).toBe('needs_cleaner');
  });

  it('suppresses active staffing prompts for cancelled jobs', () => {
    const p = resolveWorkspacePresentation(
      {
        id: '4',
        status: 'CANCELLED',
        preferredDate: '2027-01-20T00:00:00.000Z',
        assignedCleanerId: null,
      },
      NOW
    );
    expect(p.showActiveStaffing).toBe(false);
    expect(p.showPhotoPending).toBe(false);
    expect(p.staffingState).toBe('cancelled');
  });

  it('uses Review overdue job for past incomplete', () => {
    const p = resolveWorkspacePresentation(
      {
        id: '5',
        status: 'CONFIRMED',
        preferredDate: '2026-12-01T00:00:00.000Z',
      },
      NOW
    );
    expect(p.staffingState).toBe('review_overdue');
    expect(p.primaryActionLabel).toBe('Review overdue job');
  });

  it('prioritizes Set service date for unscheduled confirmed', () => {
    const p = resolveWorkspacePresentation(
      { id: '6', status: 'CONFIRMED', preferredDate: null },
      NOW
    );
    expect(p.staffingState).toBe('set_service_date');
  });
});
