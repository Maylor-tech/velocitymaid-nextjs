/**
 * Safe connection tests for the admin settings page — read-only calls that
 * confirm credentials + configured IDs actually work, without creating or
 * modifying anything.
 */
import { getDriveClient, getCalendarClient } from './client';
import { hasCompleteDriveEnvConfig, hasCompleteCalendarEnvConfig, readGoogleEnvConfig } from './config';

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export async function testDriveConnection(): Promise<ConnectionTestResult> {
  if (!hasCompleteDriveEnvConfig()) {
    return { ok: false, message: 'Drive credentials or folder ID are not fully configured.' };
  }
  const config = readGoogleEnvConfig();
  const rootFolderId = config.driveRootFolderId!;
  const sharedDriveId = config.sharedDriveId!;
  try {
    const drive = getDriveClient();
    // Shared Drive items require supportsAllDrives; fields.driveId confirms the corpus.
    const res = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name, driveId, mimeType',
      supportsAllDrives: true,
    });

    if (res.data.driveId && res.data.driveId !== sharedDriveId) {
      return {
        ok: false,
        message:
          'Root folder is reachable but is not in the configured GOOGLE_SHARED_DRIVE_ID.',
      };
    }

    // Same Shared Drive list flags as lib/google/drive.ts folder lookup.
    await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      corpora: 'drive',
      driveId: sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 1,
      fields: 'files(id)',
    });

    return {
      ok: true,
      message: `Connected — root folder "${res.data.name}" is reachable in Shared Drive.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Drive error';
    return { ok: false, message };
  }
}

export async function testCalendarConnection(): Promise<ConnectionTestResult> {
  if (!hasCompleteCalendarEnvConfig()) {
    return { ok: false, message: 'Calendar credentials or calendar ID are not fully configured.' };
  }
  const config = readGoogleEnvConfig();
  try {
    const calendar = getCalendarClient();
    // Use events.list (matches calendar.events scope) — calendars.get needs broader calendar scope.
    const res = await calendar.events.list({
      calendarId: config.operationsCalendarId!,
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
    });
    const label = config.operationsCalendarId!;
    const count = res.data.items?.length ?? 0;
    return {
      ok: true,
      message: `Connected — operations calendar "${label}" is reachable (${count} upcoming event${count === 1 ? '' : 's'} sampled).`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Calendar error';
    return { ok: false, message };
  }
}
