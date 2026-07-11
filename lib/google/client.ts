/**
 * Service-account auth for Google Drive + Calendar.
 *
 * Least-privilege scopes: drive.file (only files/folders this app creates —
 * not full drive access) and calendar.events (events only, not calendar
 * settings/ACLs). No domain-wide delegation — this JWT authenticates as the
 * service account itself, never impersonates a human mailbox.
 */
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { readGoogleEnvConfig } from './config';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function normalizePrivateKey(raw: string): string {
  // Env vars can't hold literal newlines cleanly; stored with \n escaped.
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

function buildJwt(scopes: string[]): JWT {
  const config = readGoogleEnvConfig();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!config.serviceAccountEmail || !rawKey) {
    throw new Error('Google service account credentials are not configured');
  }
  return new JWT({
    email: config.serviceAccountEmail,
    key: normalizePrivateKey(rawKey),
    scopes,
  });
}

let driveAuth: JWT | null = null;
let calendarAuth: JWT | null = null;

export function getDriveClient() {
  if (!driveAuth) driveAuth = buildJwt(DRIVE_SCOPES);
  return google.drive({ version: 'v3', auth: driveAuth });
}

export function getCalendarClient() {
  if (!calendarAuth) calendarAuth = buildJwt(CALENDAR_SCOPES);
  return google.calendar({ version: 'v3', auth: calendarAuth });
}

/** Test-only: clears memoized clients so tests can swap mocked credentials. */
export function _resetClientsForTests(): void {
  driveAuth = null;
  calendarAuth = null;
}
