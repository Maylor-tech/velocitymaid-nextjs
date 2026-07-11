/**
 * Admin notification center — actionable, read/unread admin alerts.
 * Distinct from IntegrationEventLog (a raw attempt log): this is what shows
 * up in the admin UI's notification feed. Never throws.
 */
import { prisma } from '@/lib/prisma';

export type AdminNotificationType =
  | 'NEW_QUOTE'
  | 'DEPOSIT_RECEIVED'
  | 'CLEANER_ASSIGNED'
  | 'CLEANER_ACCEPTED'
  | 'CLEANER_DECLINED'
  | 'CLEANER_NO_RESPONSE'
  | 'UPCOMING_JOB'
  | 'FAILED_EMAIL'
  | 'FAILED_DRIVE_SYNC'
  | 'FAILED_CALENDAR_SYNC'
  | 'JOB_ISSUE_REPORTED'
  | 'JOB_COMPLETED';

export type AdminNotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface CreateAdminNotificationInput {
  type: AdminNotificationType;
  severity: AdminNotificationSeverity;
  message: string;
  jobId?: string | null;
  actionUrl?: string | null;
}

export async function createAdminNotification(input: CreateAdminNotificationInput): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: input.type,
        severity: input.severity,
        jobId: input.jobId ?? null,
        message: input.message,
        actionUrl: input.actionUrl ?? null,
      },
    });
  } catch (err) {
    console.error('[createAdminNotification] Failed to write notification:', err);
  }
}

function adminJobLink(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
  return `${base}/admin/jobs/${jobId}`;
}

export const adminNotificationHelpers = { adminJobLink };
