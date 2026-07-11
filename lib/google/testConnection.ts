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
  try {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId: config.driveRootFolderId!,
      fields: 'id, name',
      supportsAllDrives: true,
    });
    return { ok: true, message: `Connected — root folder "${res.data.name}" is reachable.` };
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
    const res = await calendar.calendars.get({ calendarId: config.operationsCalendarId! });
    return { ok: true, message: `Connected — calendar "${res.data.summary}" is reachable.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Google Calendar error';
    return { ok: false, message };
  }
}
