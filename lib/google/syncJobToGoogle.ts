/**
 * Manual / admin-triggered Google Drive + Calendar sync for one job.
 * Reuses createClientJobFolder + syncJobCalendarEvent; never throws for
 * partial integration failure — each side reports its own status.
 */
import { prisma } from '@/lib/prisma';
import { isDriveEnabled, isCalendarEnabled } from '@/lib/google/config';
import { createClientJobFolder } from '@/lib/google/drive';
import { syncJobCalendarEvent } from '@/lib/google/calendar';

export type GoogleSyncStatus = 'synced' | 'skipped' | 'disabled' | 'error';

export type GoogleSyncIntegrationResult = {
  status: GoogleSyncStatus;
  message: string;
  folderId?: string | null;
  folderUrl?: string | null;
  eventId?: string | null;
  eventStatus?: string | null;
};

export type SyncJobToGoogleResult = {
  jobId: string;
  drive: GoogleSyncIntegrationResult;
  calendar: GoogleSyncIntegrationResult;
};

export async function syncJobToGoogle(jobId: string): Promise<SyncJobToGoogleResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      jobReference: true,
      customerName: true,
      driveFolderId: true,
      driveFolderUrl: true,
      calendarEventId: true,
      calendarEventStatus: true,
    },
  });

  if (!job) {
    throw new Error('JOB_NOT_FOUND');
  }

  const drive = await syncDrive(job);
  const calendar = await syncCalendar(job.id, job.calendarEventId);

  return { jobId: job.id, drive, calendar };
}

async function syncDrive(job: {
  id: string;
  jobReference: string | null;
  customerName: string | null;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
}): Promise<GoogleSyncIntegrationResult> {
  if (!(await isDriveEnabled())) {
    return {
      status: 'disabled',
      message: 'Google Drive integration is disabled or not configured.',
    };
  }

  const hadFolder = Boolean(job.driveFolderId && job.driveFolderUrl);

  try {
    const result = await createClientJobFolder({
      id: job.id,
      jobReference: job.jobReference,
      customerName: job.customerName,
    });

    const refreshed = await prisma.job.findUnique({
      where: { id: job.id },
      select: { driveFolderId: true, driveFolderUrl: true },
    });

    if (refreshed?.driveFolderId && refreshed.driveFolderUrl) {
      if (hadFolder) {
        return {
          status: 'skipped',
          message: 'Drive folder already linked — reused existing folder (no duplicate).',
          folderId: refreshed.driveFolderId,
          folderUrl: refreshed.driveFolderUrl,
        };
      }
      return {
        status: 'synced',
        message: 'Drive folder created or linked successfully.',
        folderId: refreshed.driveFolderId,
        folderUrl: refreshed.driveFolderUrl,
      };
    }

    return {
      status: 'error',
      message:
        result == null
          ? 'Drive sync failed — see IntegrationEventLog / last sync error.'
          : 'Drive sync did not persist a folder id.',
      folderId: refreshed?.driveFolderId ?? null,
      folderUrl: refreshed?.driveFolderUrl ?? null,
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown Drive sync error',
    };
  }
}

async function syncCalendar(
  jobId: string,
  previousEventId: string | null
): Promise<GoogleSyncIntegrationResult> {
  if (!(await isCalendarEnabled())) {
    return {
      status: 'disabled',
      message: 'Google Calendar integration is disabled or not configured.',
    };
  }

  const hadEvent = Boolean(previousEventId);

  try {
    await syncJobCalendarEvent(jobId);

    const refreshed = await prisma.job.findUnique({
      where: { id: jobId },
      select: { calendarEventId: true, calendarEventStatus: true },
    });

    if (refreshed?.calendarEventStatus === 'error') {
      return {
        status: 'error',
        message: 'Calendar sync failed — see IntegrationEventLog / last sync error.',
        eventId: refreshed.calendarEventId,
        eventStatus: refreshed.calendarEventStatus,
      };
    }

    if (refreshed?.calendarEventId) {
      if (hadEvent) {
        return {
          status: 'skipped',
          message: 'Calendar event already linked — patched existing event (no duplicate).',
          eventId: refreshed.calendarEventId,
          eventStatus: refreshed.calendarEventStatus,
        };
      }
      return {
        status: 'synced',
        message: 'Calendar event created successfully.',
        eventId: refreshed.calendarEventId,
        eventStatus: refreshed.calendarEventStatus,
      };
    }

    return {
      status: 'error',
      message: 'Calendar sync did not persist an event id.',
      eventId: null,
      eventStatus: refreshed?.calendarEventStatus ?? null,
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown Calendar sync error',
    };
  }
}
