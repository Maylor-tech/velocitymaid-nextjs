/**
 * Idempotent client job folder creation inside the configured Shared Drive.
 *
 * Never shares folders with guests or cleaners — this only ever creates
 * folders as the service account inside a Shared Drive whose membership is
 * managed entirely outside the app (Google Drive UI). No sharing API call
 * is ever made here.
 *
 * Idempotency has two layers: the fast path checks Job.driveFolderId first;
 * if that's missing (lost write, or first call), a live Drive query by
 * folder name guards against creating a duplicate.
 */
import { getDriveClient } from './client';
import { readGoogleEnvConfig, isDriveEnabled, recordSyncError } from './config';
import { prisma } from '@/lib/prisma';
import { logIntegrationEvent } from './integrationLog';

export const CLIENT_JOB_SUBFOLDERS = [
  '01 Intake',
  '02 Quote & Agreement',
  '03 Job Photos',
  '04 Invoice & Payments',
  '05 Communications',
] as const;

export interface DriveFolderResult {
  folderId: string;
  folderUrl: string;
}

export interface DriveJobInput {
  id: string;
  jobReference: string | null;
  customerName: string | null;
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFolderByName(
  drive: ReturnType<typeof getDriveClient>,
  parentId: string,
  name: string,
  sharedDriveId: string
): Promise<string | null> {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapeDriveQueryValue(name)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    corpora: 'drive',
    driveId: sharedDriveId,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: 'files(id, name)',
  });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: 'id',
  });
  if (!res.data.id) throw new Error('Drive did not return a folder id');
  return res.data.id;
}

/**
 * Creates "VM-2026-0001 — Client Name" inside the configured root folder,
 * with the 5 standard subfolders, and stores the result on the Job row.
 * Returns null (never throws) if Drive is disabled or the call fails — a
 * Drive outage must never block a booking.
 */
export async function createClientJobFolder(job: DriveJobInput): Promise<DriveFolderResult | null> {
  if (!(await isDriveEnabled())) return null;

  const existing = await prisma.job.findUnique({
    where: { id: job.id },
    select: { driveFolderId: true, driveFolderUrl: true },
  });
  if (existing?.driveFolderId && existing.driveFolderUrl) {
    return { folderId: existing.driveFolderId, folderUrl: existing.driveFolderUrl };
  }

  const config = readGoogleEnvConfig();
  const rootFolderId = config.driveRootFolderId;
  const sharedDriveId = config.sharedDriveId;
  if (!rootFolderId || !sharedDriveId) return null;

  const reference = job.jobReference || job.id;
  const folderName = `${reference} — ${job.customerName || 'Client'}`;

  try {
    const drive = getDriveClient();

    let folderId = await findFolderByName(drive, rootFolderId, folderName, sharedDriveId);
    if (!folderId) {
      folderId = await createFolder(drive, folderName, rootFolderId);
      for (const subfolderName of CLIENT_JOB_SUBFOLDERS) {
        await createFolder(drive, subfolderName, folderId);
      }
    }

    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    await prisma.job.update({
      where: { id: job.id },
      data: { driveFolderId: folderId, driveFolderUrl: folderUrl },
    });
    await logIntegrationEvent({
      jobId: job.id,
      channel: 'DRIVE',
      action: 'CREATE_DRIVE_FOLDER',
      provider: 'GOOGLE_DRIVE',
      status: 'SUCCESS',
      triggeredBy: 'system',
    });

    return { folderId, folderUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Drive error';
    await logIntegrationEvent({
      jobId: job.id,
      channel: 'DRIVE',
      action: 'CREATE_DRIVE_FOLDER',
      provider: 'GOOGLE_DRIVE',
      status: 'FAILED',
      triggeredBy: 'system',
      errorSummary: message,
    });
    await recordSyncError(message);
    return null;
  }
}
