/**
 * Integration Health predicates, severity, dedupe, and retry-refresh contract.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  isManualJob,
  isSyncEligibleJob,
  collectReasonsForJob,
  buildHealthJobIssues,
  computeOverallHealthStatus,
  retryJobGoogleSyncAndRefreshHealth,
  MANUAL_JOB_SOURCE_MARKER,
  type IntegrationHealthReport,
} from '../integrationHealth';

const baseJob = {
  id: 'job-1',
  jobReference: 'VM-2026-0001',
  customerName: 'Jane Doe',
  preferredDate: new Date('2026-08-01T14:00:00Z'),
  status: 'CONFIRMED',
  reviewStatus: 'APPROVED',
  internalNotes: null as string | null,
  calendarEventId: 'event-1' as string | null,
  calendarEventStatus: 'synced' as string | null,
  driveFolderId: 'folder-1' as string | null,
};

describe('isManualJob / isSyncEligibleJob', () => {
  it('detects manual jobs via canonical marker only', () => {
    expect(isManualJob({ internalNotes: `${MANUAL_JOB_SOURCE_MARKER}\nCleaner: X` })).toBe(true);
    expect(isManualJob({ internalNotes: 'phone booking' })).toBe(false);
    expect(isManualJob({ internalNotes: null })).toBe(false);
  });

  it('APPROVED jobs are eligible; pending Stripe/deposit are not', () => {
    expect(
      isSyncEligibleJob({ status: 'RECEIVED', reviewStatus: 'PENDING', internalNotes: null })
    ).toBe(false);
    expect(
      isSyncEligibleJob({ status: 'CONFIRMED', reviewStatus: 'APPROVED', internalNotes: null })
    ).toBe(true);
  });

  it('manual PENDING jobs are eligible', () => {
    expect(
      isSyncEligibleJob({
        status: 'CONFIRMED',
        reviewStatus: 'PENDING',
        internalNotes: MANUAL_JOB_SOURCE_MARKER,
      })
    ).toBe(true);
  });

  it('cancelled and rejected are never eligible for missing-artifact warnings', () => {
    expect(
      isSyncEligibleJob({
        status: 'CANCELLED',
        reviewStatus: 'APPROVED',
        internalNotes: null,
      })
    ).toBe(false);
    expect(
      isSyncEligibleJob({
        status: 'CONFIRMED',
        reviewStatus: 'REJECTED',
        internalNotes: null,
      })
    ).toBe(false);
  });
});

describe('collectReasonsForJob / buildHealthJobIssues', () => {
  const bothOn = { driveEnabled: true, calendarEnabled: true };

  it('calendarEventStatus=error is always CALENDAR_ERROR (critical)', () => {
    const reasons = collectReasonsForJob(
      { ...baseJob, calendarEventStatus: 'error', status: 'CANCELLED' },
      bothOn
    );
    expect(reasons).toContain('CALENDAR_ERROR');
  });

  it('APPROVED + enabled + missing folder → MISSING_DRIVE_FOLDER', () => {
    expect(
      collectReasonsForJob({ ...baseJob, driveFolderId: null }, bothOn)
    ).toContain('MISSING_DRIVE_FOLDER');
  });

  it('pending deposit without MANUAL → no missing reasons', () => {
    const reasons = collectReasonsForJob(
      {
        ...baseJob,
        reviewStatus: 'PENDING',
        driveFolderId: null,
        calendarEventId: null,
      },
      bothOn
    );
    expect(reasons).toEqual([]);
  });

  it('MANUAL + missing folder → Drive warning', () => {
    const reasons = collectReasonsForJob(
      {
        ...baseJob,
        reviewStatus: 'PENDING',
        internalNotes: MANUAL_JOB_SOURCE_MARKER,
        driveFolderId: null,
      },
      bothOn
    );
    expect(reasons).toEqual(['MISSING_DRIVE_FOLDER']);
  });

  it('missing Calendar without preferredDate is not an issue', () => {
    const reasons = collectReasonsForJob(
      { ...baseJob, calendarEventId: null, preferredDate: null },
      bothOn
    );
    expect(reasons).not.toContain('MISSING_CALENDAR_EVENT');
  });

  it('preferredDate + eligible + no event → MISSING_CALENDAR_EVENT', () => {
    expect(
      collectReasonsForJob({ ...baseJob, calendarEventId: null }, bothOn)
    ).toContain('MISSING_CALENDAR_EVENT');
  });

  it('disabled integration means no missing-artifact warning', () => {
    const reasons = collectReasonsForJob(
      { ...baseJob, calendarEventId: null, driveFolderId: null },
      { driveEnabled: false, calendarEnabled: false }
    );
    expect(reasons).toEqual([]);
  });

  it('cancelled with merely missing IDs is not an issue (unless calendar error)', () => {
    const reasons = collectReasonsForJob(
      {
        ...baseJob,
        status: 'CANCELLED',
        calendarEventId: null,
        driveFolderId: null,
        calendarEventStatus: null,
      },
      bothOn
    );
    expect(reasons).toEqual([]);
  });

  it('dedupes one job row with multiple reasons; critical wins', () => {
    const jobs = buildHealthJobIssues(
      [
        {
          ...baseJob,
          calendarEventStatus: 'error',
          calendarEventId: null,
          driveFolderId: null,
        },
      ],
      bothOn
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].reasons).toEqual(
      expect.arrayContaining(['CALENDAR_ERROR', 'MISSING_CALENDAR_EVENT', 'MISSING_DRIVE_FOLDER'])
    );
    expect(jobs[0].severity).toBe('critical');
  });
});

describe('computeOverallHealthStatus', () => {
  it('is healthy when there are no open job exceptions', () => {
    expect(computeOverallHealthStatus([])).toBe('healthy');
  });

  it('is attention for warnings only', () => {
    expect(
      computeOverallHealthStatus([
        {
          jobId: 'j1',
          jobReference: 'VM-1',
          customerName: 'A',
          preferredDate: null,
          reasons: ['MISSING_DRIVE_FOLDER'],
          severity: 'warning',
        },
      ])
    ).toBe('attention');
  });

  it('is critical when any open job is critical', () => {
    expect(
      computeOverallHealthStatus([
        {
          jobId: 'j1',
          jobReference: 'VM-1',
          customerName: 'A',
          preferredDate: null,
          reasons: ['CALENDAR_ERROR'],
          severity: 'critical',
        },
      ])
    ).toBe('critical');
  });

  it('old FAILED IntegrationEventLog must not make overall status critical when jobs are healthy', () => {
    // Supporting context (logs / lastSyncError) is intentionally not an argument —
    // overall status is computed from open jobs only.
    const healthyJobs: [] = [];
    expect(computeOverallHealthStatus(healthyJobs)).toBe('healthy');
  });
});

describe('retryJobGoogleSyncAndRefreshHealth', () => {
  it('refetches server health after retry rather than assuming success locally', async () => {
    const sync = vi.fn(async () => ({
      ok: true,
      body: { success: true, drive: { status: 'synced' }, calendar: { status: 'synced' } },
    }));
    const serverHealth: IntegrationHealthReport = {
      overallStatus: 'attention',
      jobs: [
        {
          jobId: 'job-1',
          jobReference: 'VM-1',
          customerName: 'Still Broken',
          preferredDate: null,
          reasons: ['MISSING_DRIVE_FOLDER'],
          severity: 'warning',
        },
      ],
      recentFailures: [],
      lastSyncError: null,
      lastSyncErrorAt: null,
      driveEnabled: true,
      calendarEnabled: true,
    };
    const fetchHealth = vi.fn(async () => serverHealth);

    const result = await retryJobGoogleSyncAndRefreshHealth({
      jobId: 'job-1',
      sync,
      fetchHealth,
    });

    expect(sync).toHaveBeenCalledWith('job-1');
    expect(fetchHealth).toHaveBeenCalledTimes(1);
    // Must use server truth — job still present despite sync reporting synced
    expect(result.health.jobs).toHaveLength(1);
    expect(result.health.jobs[0].jobId).toBe('job-1');
    expect(result.health).toBe(serverHealth);
  });
});
