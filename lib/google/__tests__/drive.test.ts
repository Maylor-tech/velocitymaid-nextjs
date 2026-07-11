/**
 * Tests createClientJobFolder()'s two-layer idempotency (stored
 * driveFolderId first, then a live Drive query by name) and that failures
 * are logged rather than thrown — a Drive outage must never block a
 * booking. Mocks the Google API client entirely; makes no real API calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockJob, driveMock } = vi.hoisted(() => {
  const mockJob: {
    id: string;
    driveFolderId: string | null;
    driveFolderUrl: string | null;
    updates: Array<{ driveFolderId: string; driveFolderUrl: string }>;
  } = { id: 'job-1', driveFolderId: null, driveFolderUrl: null, updates: [] };

  const driveMock = {
    filesListResult: null as { id: string } | null,
    createdFolders: [] as string[],
    shouldThrow: false,
  };

  return { mockJob, driveMock };
});

vi.mock('../../prisma', () => ({
  prisma: {
    job: {
      findUnique: vi.fn(async () => ({
        driveFolderId: mockJob.driveFolderId,
        driveFolderUrl: mockJob.driveFolderUrl,
      })),
      update: vi.fn(async ({ data }: any) => {
        mockJob.updates.push(data);
        mockJob.driveFolderId = data.driveFolderId;
        mockJob.driveFolderUrl = data.driveFolderUrl;
        return mockJob;
      }),
    },
  },
}));

vi.mock('../client', () => ({
  getDriveClient: vi.fn(() => {
    if (driveMock.shouldThrow) {
      return {
        files: {
          list: vi.fn(async () => {
            throw new Error('Simulated Drive API failure');
          }),
        },
      };
    }
    return {
      files: {
        list: vi.fn(async () => ({ data: { files: driveMock.filesListResult ? [driveMock.filesListResult] : [] } })),
        create: vi.fn(async ({ requestBody }: any) => {
          const id = `folder-${driveMock.createdFolders.length + 1}`;
          driveMock.createdFolders.push(requestBody.name);
          return { data: { id } };
        }),
      },
    };
  }),
}));

vi.mock('../config', () => ({
  readGoogleEnvConfig: vi.fn(() => ({
    driveRootFolderId: 'root-folder-id',
    sharedDriveId: 'shared-drive-id',
  })),
  isDriveEnabled: vi.fn(async () => true),
  recordSyncError: vi.fn(async () => {}),
}));

vi.mock('../integrationLog', () => ({
  logIntegrationEvent: vi.fn(async () => {}),
}));

import { createClientJobFolder } from '../drive';
import { isDriveEnabled } from '../config';
import { logIntegrationEvent } from '../integrationLog';

describe('createClientJobFolder', () => {
  beforeEach(() => {
    mockJob.driveFolderId = null;
    mockJob.driveFolderUrl = null;
    mockJob.updates = [];
    driveMock.filesListResult = null;
    driveMock.createdFolders = [];
    driveMock.shouldThrow = false;
    vi.mocked(isDriveEnabled).mockResolvedValue(true);
    vi.clearAllMocks();
  });

  it('returns null immediately when Drive is disabled — no API calls at all', async () => {
    vi.mocked(isDriveEnabled).mockResolvedValue(false);
    const result = await createClientJobFolder({ id: 'job-1', jobReference: 'VM-2026-0001', customerName: 'Test Client' });
    expect(result).toBeNull();
    expect(mockJob.updates).toHaveLength(0);
  });

  it('fast path: returns the stored folder without calling Drive when Job already has one', async () => {
    mockJob.driveFolderId = 'existing-folder-id';
    mockJob.driveFolderUrl = 'https://drive.google.com/drive/folders/existing-folder-id';

    const result = await createClientJobFolder({ id: 'job-1', jobReference: 'VM-2026-0001', customerName: 'Test Client' });

    expect(result).toEqual({ folderId: 'existing-folder-id', folderUrl: 'https://drive.google.com/drive/folders/existing-folder-id' });
    expect(driveMock.createdFolders).toHaveLength(0); // never touched the Drive API
  });

  it('creates the client folder + 5 subfolders when none exists yet, then persists the id', async () => {
    const result = await createClientJobFolder({ id: 'job-1', jobReference: 'VM-2026-0001', customerName: 'Jane Doe' });

    expect(result).not.toBeNull();
    expect(driveMock.createdFolders[0]).toBe('VM-2026-0001 — Jane Doe');
    expect(driveMock.createdFolders).toHaveLength(6); // client folder + 5 subfolders
    expect(driveMock.createdFolders.slice(1)).toEqual([
      '01 Intake',
      '02 Quote & Agreement',
      '03 Job Photos',
      '04 Invoice & Payments',
      '05 Communications',
    ]);
    expect(mockJob.updates).toHaveLength(1); // persisted exactly once
  });

  it('duplicate-folder prevention: reuses an existing Drive folder found by name instead of creating a new one', async () => {
    driveMock.filesListResult = { id: 'found-existing-folder' };

    const result = await createClientJobFolder({ id: 'job-1', jobReference: 'VM-2026-0001', customerName: 'Jane Doe' });

    expect(result?.folderId).toBe('found-existing-folder');
    expect(driveMock.createdFolders).toHaveLength(0); // did not create a duplicate
  });

  it('logs failure and returns null (never throws) when the Drive API errors', async () => {
    driveMock.shouldThrow = true;

    const result = await createClientJobFolder({ id: 'job-1', jobReference: 'VM-2026-0001', customerName: 'Jane Doe' });

    expect(result).toBeNull();
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', channel: 'DRIVE', action: 'CREATE_DRIVE_FOLDER' })
    );
  });
});
