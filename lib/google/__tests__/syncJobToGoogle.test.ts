/**
 * Unit tests for manual per-job Google sync orchestration.
 * Mocks Drive/Calendar helpers — no real Google API calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  job: {
    id: 'job-1',
    jobReference: 'VM-2026-0015',
    customerName: 'Tiffany Mayo',
    driveFolderId: null as string | null,
    driveFolderUrl: null as string | null,
    calendarEventId: null as string | null,
    calendarEventStatus: null as string | null,
  },
  driveEnabled: true,
  calendarEnabled: true,
  driveShouldFail: false,
  calendarShouldFail: false,
  createClientJobFolder: vi.fn(),
  syncJobCalendarEvent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: vi.fn(async () => {
        if (!mocks.job) return null;
        return { ...mocks.job };
      }),
    },
  },
}));

vi.mock('@/lib/google/config', () => ({
  isDriveEnabled: vi.fn(async () => mocks.driveEnabled),
  isCalendarEnabled: vi.fn(async () => mocks.calendarEnabled),
}));

vi.mock('@/lib/google/drive', () => ({
  createClientJobFolder: (...args: unknown[]) => mocks.createClientJobFolder(...args),
}));

vi.mock('@/lib/google/calendar', () => ({
  syncJobCalendarEvent: (...args: unknown[]) => mocks.syncJobCalendarEvent(...args),
}));

import { syncJobToGoogle } from '../syncJobToGoogle';
import { prisma } from '@/lib/prisma';

describe('syncJobToGoogle', () => {
  beforeEach(() => {
    mocks.job = {
      id: 'job-1',
      jobReference: 'VM-2026-0015',
      customerName: 'Tiffany Mayo',
      driveFolderId: null,
      driveFolderUrl: null,
      calendarEventId: null,
      calendarEventStatus: null,
    };
    mocks.driveEnabled = true;
    mocks.calendarEnabled = true;
    mocks.driveShouldFail = false;
    mocks.calendarShouldFail = false;
    vi.clearAllMocks();

    mocks.createClientJobFolder.mockImplementation(async () => {
      if (mocks.driveShouldFail) return null;
      if (mocks.job.driveFolderId && mocks.job.driveFolderUrl) {
        return {
          folderId: mocks.job.driveFolderId,
          folderUrl: mocks.job.driveFolderUrl,
        };
      }
      mocks.job.driveFolderId = 'folder-new';
      mocks.job.driveFolderUrl = 'https://drive.google.com/drive/folders/folder-new';
      return {
        folderId: mocks.job.driveFolderId,
        folderUrl: mocks.job.driveFolderUrl,
      };
    });

    mocks.syncJobCalendarEvent.mockImplementation(async () => {
      if (mocks.calendarShouldFail) {
        mocks.job.calendarEventStatus = 'error';
        return;
      }
      if (!mocks.job.calendarEventId) {
        mocks.job.calendarEventId = 'event-new';
      }
      mocks.job.calendarEventStatus = 'synced';
    });
  });

  it('unsynced job → creates Drive folder and Calendar event', async () => {
    const result = await syncJobToGoogle('job-1');
    expect(result.drive.status).toBe('synced');
    expect(result.drive.folderId).toBe('folder-new');
    expect(result.calendar.status).toBe('synced');
    expect(result.calendar.eventId).toBe('event-new');
    expect(mocks.createClientJobFolder).toHaveBeenCalledTimes(1);
    expect(mocks.syncJobCalendarEvent).toHaveBeenCalledWith('job-1');
  });

  it('second sync → no duplicate folder/event (skipped)', async () => {
    mocks.job.driveFolderId = 'folder-existing';
    mocks.job.driveFolderUrl = 'https://drive.google.com/drive/folders/folder-existing';
    mocks.job.calendarEventId = 'event-existing';
    mocks.job.calendarEventStatus = 'synced';

    const result = await syncJobToGoogle('job-1');
    expect(result.drive.status).toBe('skipped');
    expect(result.drive.folderId).toBe('folder-existing');
    expect(result.calendar.status).toBe('skipped');
    expect(result.calendar.eventId).toBe('event-existing');
    expect(mocks.createClientJobFolder).toHaveBeenCalledTimes(1);
    expect(mocks.syncJobCalendarEvent).toHaveBeenCalledTimes(1);
  });

  it('Drive disabled → Calendar can still sync', async () => {
    mocks.driveEnabled = false;
    const result = await syncJobToGoogle('job-1');
    expect(result.drive.status).toBe('disabled');
    expect(result.calendar.status).toBe('synced');
    expect(mocks.createClientJobFolder).not.toHaveBeenCalled();
    expect(mocks.syncJobCalendarEvent).toHaveBeenCalledTimes(1);
  });

  it('Calendar disabled → Drive can still sync', async () => {
    mocks.calendarEnabled = false;
    const result = await syncJobToGoogle('job-1');
    expect(result.drive.status).toBe('synced');
    expect(result.calendar.status).toBe('disabled');
    expect(mocks.createClientJobFolder).toHaveBeenCalledTimes(1);
    expect(mocks.syncJobCalendarEvent).not.toHaveBeenCalled();
  });

  it('one integration failure does not erase the other success', async () => {
    mocks.driveShouldFail = true;
    const result = await syncJobToGoogle('job-1');
    expect(result.drive.status).toBe('error');
    expect(result.drive.folderId == null).toBe(true);
    expect(result.calendar.status).toBe('synced');
    expect(result.calendar.eventId).toBe('event-new');
  });

  it('throws JOB_NOT_FOUND when job missing', async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValueOnce(null as never);
    await expect(syncJobToGoogle('missing')).rejects.toThrow('JOB_NOT_FOUND');
  });
});
