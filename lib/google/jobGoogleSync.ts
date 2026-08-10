/**
 * Google Workspace sync helpers for job lifecycle hooks.
 *
 * Job DB writes remain authoritative. Google failures are recorded inside
 * Drive/Calendar helpers (IntegrationEventLog + lastSyncError); manual Sync
 * remains recovery. Idempotency is owned by those helpers (reuse folder/event ids).
 *
 * On Vercel/serverless, fire-and-forget `queue*` may freeze after the response
 * is sent before Google work finishes. Prefer `awaitJobGoogleSync` (or await
 * the matching calendar helper) on paths that must complete in-request.
 *
 * Supabase/Prisma Job remains the source of truth. No bulk backfill.
 */
import { syncJobToGoogle } from './syncJobToGoogle';
import { syncJobCalendarEvent, cancelJobCalendarEventById } from './calendar';

/**
 * Await Drive + Calendar sync in the current request lifecycle.
 * Never throws — safe to call after a successful Job commit.
 */
export async function awaitJobGoogleSync(jobId: string): Promise<void> {
  try {
    await syncJobToGoogle(jobId);
  } catch {
    // Errors already recorded inside Drive/Calendar helpers.
  }
}

/** Fire-and-forget Drive+Calendar. Prefer awaitJobGoogleSync on serverless creates. */
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
