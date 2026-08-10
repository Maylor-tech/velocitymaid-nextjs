/**
 * Google Workspace sync helpers for job lifecycle hooks.
 *
 * Job DB writes remain authoritative. Google failures are recorded inside
 * Drive/Calendar helpers (IntegrationEventLog + lastSyncError); manual Sync
 * remains recovery. Idempotency is owned by those helpers (reuse folder/event ids).
 *
 * On Vercel/serverless, fire-and-forget `queue*` may freeze after the response
 * is sent before Google work finishes. Prefer the `await*` helpers on request
 * / webhook / cron paths that must complete in-request.
 *
 * Ordering: commit the Job/business mutation first, then `await` the matching
 * non-throwing helper. A Google outage must not turn a successful business
 * write into an HTTP failure that encourages the client to retry the mutation.
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

/**
 * Await Calendar create/update (assign, reassign, reschedule, team).
 * Never throws.
 */
export async function awaitJobCalendarSync(jobId: string): Promise<void> {
  try {
    await syncJobCalendarEvent(jobId);
  } catch {
    // Errors already recorded inside Calendar helpers.
  }
}

/**
 * Await Calendar cancel (mark cancelled, not delete).
 * Never throws. One cancel request should reliably attempt this once.
 */
export async function awaitJobCalendarCancel(jobId: string): Promise<void> {
  try {
    await cancelJobCalendarEventById(jobId);
  } catch {
    // Errors already recorded inside Calendar helpers.
  }
}

/** @deprecated Prefer awaitJobGoogleSync on serverless request paths. */
export function queueJobGoogleSync(jobId: string): void {
  void awaitJobGoogleSync(jobId);
}

/** @deprecated Prefer awaitJobCalendarSync on serverless request paths. */
export function queueJobCalendarSync(jobId: string): void {
  void awaitJobCalendarSync(jobId);
}

/** @deprecated Prefer awaitJobCalendarCancel on serverless request paths. */
export function queueJobCalendarCancel(jobId: string): void {
  void awaitJobCalendarCancel(jobId);
}
