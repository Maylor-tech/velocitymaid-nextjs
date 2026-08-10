/**
 * Google Workspace Integration Health — exception desk (read-first).
 *
 * Open health is derived from **current Job state** only.
 * IntegrationEventLog failures and lastSyncError are supporting context —
 * they must not keep overall status critical after the related job is healthy.
 *
 * Does not call Google APIs. Does not change sync lifecycle.
 */
import { prisma } from '@/lib/prisma';
import {
  hasCompleteDriveEnvConfig,
  hasCompleteCalendarEnvConfig,
} from '@/lib/google/config';

/** Canonical marker written by admin manual job create. */
export const MANUAL_JOB_SOURCE_MARKER = '[Source: MANUAL]';

export type HealthReason = 'CALENDAR_ERROR' | 'MISSING_CALENDAR_EVENT' | 'MISSING_DRIVE_FOLDER';
export type JobHealthSeverity = 'critical' | 'warning';
export type OverallHealthStatus = 'healthy' | 'attention' | 'critical';

export type HealthJobIssue = {
  jobId: string;
  jobReference: string | null;
  customerName: string | null;
  preferredDate: string | null;
  reasons: HealthReason[];
  severity: JobHealthSeverity;
};

export type HealthFailedLog = {
  id: string;
  jobId: string | null;
  jobReference: string | null;
  channel: string;
  action: string;
  errorSummary: string | null;
  createdAt: string;
};

export type IntegrationHealthReport = {
  overallStatus: OverallHealthStatus;
  jobs: HealthJobIssue[];
  recentFailures: HealthFailedLog[];
  lastSyncError: string | null;
  lastSyncErrorAt: string | null;
  driveEnabled: boolean;
  calendarEnabled: boolean;
};

const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_EMERGENCY'] as const;
const JOB_ISSUE_LIMIT = 50;
const RECENT_FAILURE_LIMIT = 25;

export function isManualJob(job: { internalNotes?: string | null }): boolean {
  return Boolean(job.internalNotes?.includes(MANUAL_JOB_SOURCE_MARKER));
}

/**
 * Jobs that auto-sync would have targeted: approved bookings or manual creates.
 * Cancelled / rejected are never eligible for missing-artifact warnings.
 */
export function isSyncEligibleJob(job: {
  status: string;
  reviewStatus: string;
  internalNotes?: string | null;
}): boolean {
  if (CANCELLED_STATUSES.includes(job.status as (typeof CANCELLED_STATUSES)[number])) {
    return false;
  }
  if (job.reviewStatus === 'REJECTED') return false;
  if (job.reviewStatus === 'APPROVED') return true;
  return isManualJob(job);
}

export function severityForReasons(reasons: HealthReason[]): JobHealthSeverity {
  return reasons.includes('CALENDAR_ERROR') ? 'critical' : 'warning';
}

/** Overall status from open job exceptions only — never from historical logs. */
export function computeOverallHealthStatus(jobs: HealthJobIssue[]): OverallHealthStatus {
  if (jobs.some((j) => j.severity === 'critical')) return 'critical';
  if (jobs.length > 0) return 'attention';
  return 'healthy';
}

type JobCandidate = {
  id: string;
  jobReference: string | null;
  customerName: string | null;
  preferredDate: Date | null;
  status: string;
  reviewStatus: string;
  internalNotes: string | null;
  calendarEventId: string | null;
  calendarEventStatus: string | null;
  driveFolderId: string | null;
};

export function collectReasonsForJob(
  job: JobCandidate,
  opts: { driveEnabled: boolean; calendarEnabled: boolean }
): HealthReason[] {
  const reasons: HealthReason[] = [];

  if (job.calendarEventStatus === 'error') {
    reasons.push('CALENDAR_ERROR');
  }

  if (opts.calendarEnabled && isSyncEligibleJob(job)) {
    if (!job.calendarEventId && job.preferredDate) {
      reasons.push('MISSING_CALENDAR_EVENT');
    }
  }

  if (opts.driveEnabled && isSyncEligibleJob(job)) {
    if (!job.driveFolderId) {
      reasons.push('MISSING_DRIVE_FOLDER');
    }
  }

  return reasons;
}

export function buildHealthJobIssues(
  candidates: JobCandidate[],
  opts: { driveEnabled: boolean; calendarEnabled: boolean }
): HealthJobIssue[] {
  const byId = new Map<string, HealthJobIssue>();

  for (const job of candidates) {
    const reasons = collectReasonsForJob(job, opts);
    if (reasons.length === 0) continue;

    const existing = byId.get(job.id);
    if (existing) {
      const merged = Array.from(new Set([...existing.reasons, ...reasons]));
      existing.reasons = merged;
      existing.severity = severityForReasons(merged);
      continue;
    }

    byId.set(job.id, {
      jobId: job.id,
      jobReference: job.jobReference,
      customerName: job.customerName,
      preferredDate: job.preferredDate ? job.preferredDate.toISOString() : null,
      reasons,
      severity: severityForReasons(reasons),
    });
  }

  const jobs = Array.from(byId.values());
  jobs.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return (b.preferredDate ?? '').localeCompare(a.preferredDate ?? '');
  });
  return jobs.slice(0, JOB_ISSUE_LIMIT);
}

const jobSelect = {
  id: true,
  jobReference: true,
  customerName: true,
  preferredDate: true,
  status: true,
  reviewStatus: true,
  internalNotes: true,
  calendarEventId: true,
  calendarEventStatus: true,
  driveFolderId: true,
} as const;

/**
 * After a Sync to Google retry completes, always replace health from the
 * server GET — never drop a row based on the sync response alone.
 */
export async function retryJobGoogleSyncAndRefreshHealth(opts: {
  jobId: string;
  sync: (jobId: string) => Promise<{ ok: boolean; body: unknown }>;
  fetchHealth: () => Promise<IntegrationHealthReport>;
}): Promise<{ sync: { ok: boolean; body: unknown }; health: IntegrationHealthReport }> {
  const sync = await opts.sync(opts.jobId);
  const health = await opts.fetchHealth();
  return { sync, health };
}

export async function getIntegrationHealthReport(): Promise<IntegrationHealthReport> {
  const settings = await prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  const driveEnabled = hasCompleteDriveEnvConfig() && settings.googleDriveConnected;
  const calendarEnabled = hasCompleteCalendarEnvConfig() && settings.googleCalendarConnected;

  const eligibleOr = [
    { reviewStatus: 'APPROVED' as const },
    { internalNotes: { contains: MANUAL_JOB_SOURCE_MARKER } },
  ];

  const [calendarErrors, missingCalendar, missingDrive, recentFailureRows] = await Promise.all([
    prisma.job.findMany({
      where: { calendarEventStatus: 'error' },
      select: jobSelect,
      orderBy: { updatedAt: 'desc' },
      take: JOB_ISSUE_LIMIT,
    }),
    calendarEnabled
      ? prisma.job.findMany({
          where: {
            calendarEventId: null,
            preferredDate: { not: null },
            status: { notIn: [...CANCELLED_STATUSES] },
            reviewStatus: { not: 'REJECTED' },
            OR: eligibleOr,
          },
          select: jobSelect,
          orderBy: { updatedAt: 'desc' },
          take: JOB_ISSUE_LIMIT,
        })
      : Promise.resolve([]),
    driveEnabled
      ? prisma.job.findMany({
          where: {
            driveFolderId: null,
            status: { notIn: [...CANCELLED_STATUSES] },
            reviewStatus: { not: 'REJECTED' },
            OR: eligibleOr,
          },
          select: jobSelect,
          orderBy: { updatedAt: 'desc' },
          take: JOB_ISSUE_LIMIT,
        })
      : Promise.resolve([]),
    prisma.integrationEventLog.findMany({
      where: {
        status: 'FAILED',
        channel: { in: ['DRIVE', 'CALENDAR'] },
      },
      select: {
        id: true,
        jobId: true,
        channel: true,
        action: true,
        errorSummary: true,
        createdAt: true,
        Job: { select: { jobReference: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_FAILURE_LIMIT,
    }),
  ]);

  const candidates = new Map<string, JobCandidate>();
  for (const row of [...calendarErrors, ...missingCalendar, ...missingDrive]) {
    candidates.set(row.id, row as JobCandidate);
  }

  const jobs = buildHealthJobIssues(Array.from(candidates.values()), {
    driveEnabled,
    calendarEnabled,
  });

  const recentFailures: HealthFailedLog[] = recentFailureRows.map((row) => ({
    id: row.id,
    jobId: row.jobId,
    jobReference: row.Job?.jobReference ?? null,
    channel: row.channel,
    action: row.action,
    errorSummary: row.errorSummary,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    overallStatus: computeOverallHealthStatus(jobs),
    jobs,
    recentFailures,
    lastSyncError: settings.lastSyncError,
    lastSyncErrorAt: settings.lastSyncErrorAt ? settings.lastSyncErrorAt.toISOString() : null,
    driveEnabled,
    calendarEnabled,
  };
}
