/**
 * Fire-and-forget Google Workspace sync for job lifecycle hooks.
 *
 * Never blocks the core VelocityMaid job operation — callers invoke these
 * after DB writes succeed. Failures are recorded inside Drive/Calendar
 * helpers (IntegrationEventLog + lastSyncError); manual Sync remains recovery.
 *
 * Supabase/Prisma Job remains the source of truth. No bulk backfill.
 */
import { syncJobToGoogle } from './syncJobToGoogle';
import { syncJobCalendarEvent, cancelJobCalendarEventById } from './calendar';

/** Drive folder create/reuse + Calendar upsert (Calendar gated on preferredDate for creates). */
export function queueJobGoogleSync(jobId: string): void {
  void syncJobToGoogle(jobId).catch(() => {});
}

/** Calendar event create/update only (assign, reassign, reschedule). */
export function queueJobCalendarSync(jobId: string): void {
  void syncJobCalendarEvent(jobId).catch(() => {});
}

/** Mark ops-calendar event cancelled (not deleted) per existing policy. */
export function queueJobCalendarCancel(jobId: string): void {
  void cancelJobCalendarEventById(jobId).catch(() => {});
}
