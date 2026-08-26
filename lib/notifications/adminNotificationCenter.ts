/**
 * Admin notification center — actionable, read/unread admin alerts.
 * Distinct from IntegrationEventLog (a raw attempt log): this is what shows
 * up in the admin UI's notification feed. Never throws.
 */
import { prisma } from '@/lib/prisma';

export type AdminNotificationType =
  | 'NEW_QUOTE'
  | 'DEPOSIT_RECEIVED'
  | 'HOST_CLEANING_REQUEST'
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
  /**
   * When true and jobId is set, reuse an existing row of the same type for
   * that job instead of inserting a duplicate.
   */
  idempotent?: boolean;
}

export type CreateAdminNotificationResult = {
  ok: boolean;
  created: boolean;
  id: string | null;
  error?: string;
};

export async function createAdminNotification(
  input: CreateAdminNotificationInput
): Promise<CreateAdminNotificationResult> {
  try {
    if (input.idempotent && input.jobId) {
      const existing = await prisma.adminNotification.findFirst({
        where: { type: input.type, jobId: input.jobId },
        select: { id: true },
      });
      if (existing) {
        console.log('[createAdminNotification] idempotent skip', {
          type: input.type,
          jobId: input.jobId,
          id: existing.id,
        });
        return { ok: true, created: false, id: existing.id };
      }
    }

    const row = await prisma.adminNotification.create({
      data: {
        type: input.type,
        severity: input.severity,
        jobId: input.jobId ?? null,
        message: input.message,
        actionUrl: input.actionUrl ?? null,
      },
      select: { id: true },
    });
    console.log('[createAdminNotification] wrote', {
      type: input.type,
      jobId: input.jobId ?? null,
      id: row.id,
    });
    return { ok: true, created: true, id: row.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to write notification';
    console.error('[createAdminNotification] Failed to write notification:', err);
    return { ok: false, created: false, id: null, error };
  }
}

function adminJobLink(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
  return `${base}/admin/jobs/${jobId}`;
}

export const adminNotificationHelpers = { adminJobLink };
