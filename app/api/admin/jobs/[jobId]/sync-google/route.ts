export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Manual Google Drive + Calendar sync for one existing job.
 *
 * POST /api/admin/jobs/[jobId]/sync-google
 *
 * Admin-only. Reuses createClientJobFolder + syncJobCalendarEvent.
 * Always returns per-integration results; one side failing does not
 * block the other or force HTTP 500.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { syncJobToGoogle } from '@/lib/google/syncJobToGoogle';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await syncJobToGoogle(jobId);
    } catch (err) {
      if (err instanceof Error && err.message === 'JOB_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      throw err;
    }

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'JOB_GOOGLE_SYNC',
      entityType: 'Job',
      entityId: jobId,
      description: `Manual Google sync — Drive: ${result.drive.status}, Calendar: ${result.calendar.status}`,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      drive: result.drive,
      calendar: result.calendar,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[JOB SYNC GOOGLE]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to sync job to Google';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
