/**
 * Shared write helper for IntegrationEventLog — covers both "record every
 * attempted send" and the integration activity log, since both are answering
 * the same question: did this external action succeed. Mirrors the
 * fire-and-forget, never-throws pattern used by lib/audit.ts::logAuditEntry.
 *
 * Also centralizes 3 of the notification-center trigger cases (failed
 * email/Drive/Calendar) here, since every failure already passes through
 * this one function — one place to get right instead of remembering it at
 * every call site.
 */
import { prisma } from '@/lib/prisma';
import { createAdminNotification, adminNotificationHelpers } from '@/lib/notifications/adminNotificationCenter';

export type IntegrationChannel = 'EMAIL' | 'DRIVE' | 'CALENDAR';
export type IntegrationStatus = 'SUCCESS' | 'FAILED';
export type IntegrationTrigger = 'cron' | 'webhook' | 'admin' | 'system';

export interface LogIntegrationEventInput {
  jobId?: string | null;
  channel: IntegrationChannel;
  action: string;
  provider: string;
  status: IntegrationStatus;
  recipient?: string | null;
  templateKey?: string | null;
  triggeredBy: IntegrationTrigger;
  errorSummary?: string | null;
}

const FAILURE_NOTIFICATION_TYPE: Record<IntegrationChannel, 'FAILED_EMAIL' | 'FAILED_DRIVE_SYNC' | 'FAILED_CALENDAR_SYNC'> = {
  EMAIL: 'FAILED_EMAIL',
  DRIVE: 'FAILED_DRIVE_SYNC',
  CALENDAR: 'FAILED_CALENDAR_SYNC',
};

export async function logIntegrationEvent(input: LogIntegrationEventInput): Promise<void> {
  try {
    await prisma.integrationEventLog.create({
      data: {
        jobId: input.jobId ?? null,
        channel: input.channel,
        action: input.action,
        provider: input.provider,
        status: input.status,
        recipient: input.recipient ?? null,
        templateKey: input.templateKey ?? null,
        triggeredBy: input.triggeredBy,
        errorSummary: input.errorSummary ?? null,
      },
    });
  } catch (err) {
    console.error('[logIntegrationEvent] Failed to write log entry:', err);
  }

  if (input.status === 'FAILED') {
    await createAdminNotification({
      type: FAILURE_NOTIFICATION_TYPE[input.channel],
      severity: 'WARNING',
      message: `${input.action} failed (${input.provider})${input.errorSummary ? `: ${input.errorSummary}` : ''}`,
      jobId: input.jobId ?? null,
      actionUrl: input.jobId ? adminNotificationHelpers.adminJobLink(input.jobId) : null,
    });
  }
}
