/**
 * Service-account auth for Google Drive + Calendar.
 *
 * Drive: JWT as the service account itself (no subject). Scopes:
 *   drive.file + drive.metadata.readonly.
 *
 * Calendar: Domain-Wide Delegation impersonating the calendar owner
 *   (GOOGLE_CALENDAR_IMPERSONATION_EMAIL). Scope exactly:
 *   https://www.googleapis.com/auth/calendar.events
 *   Fail closed if impersonation email is missing.
 */
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { readGoogleEnvConfig } from './config';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

export const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'] as const;

function normalizePrivateKey(raw: string): string {
  // Env vars can't hold literal newlines cleanly; stored with \n escaped.
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

function requireServiceAccountCredentials(): { email: string; key: string } {
  const config = readGoogleEnvConfig();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!config.serviceAccountEmail || !rawKey) {
    throw new Error('Google service account credentials are not configured');
  }
  return { email: config.serviceAccountEmail, key: normalizePrivateKey(rawKey) };
}

function buildDriveJwt(): JWT {
  const { email, key } = requireServiceAccountCredentials();
  return new JWT({
    email,
    key,
    scopes: [...DRIVE_SCOPES],
    // Intentionally no subject — Drive acts as the service account itself.
  });
}

function buildCalendarJwt(): JWT {
  const { email, key } = requireServiceAccountCredentials();
  const config = readGoogleEnvConfig();
  const subject = config.calendarImpersonationEmail;
  if (!subject) {
    throw new Error(
      'GOOGLE_CALENDAR_IMPERSONATION_EMAIL is required for Calendar Domain-Wide Delegation'
    );
  }
  return new JWT({
    email,
    key,
    scopes: [...CALENDAR_SCOPES],
    subject,
  });
}

let driveAuth: JWT | null = null;
let calendarAuth: JWT | null = null;

export function getDriveClient() {
  if (!driveAuth) driveAuth = buildDriveJwt();
  return google.drive({ version: 'v3', auth: driveAuth });
}

export function getCalendarClient() {
  if (!calendarAuth) calendarAuth = buildCalendarJwt();
  return google.calendar({ version: 'v3', auth: calendarAuth });
}

/** Test-only: clears memoized clients so tests can swap mocked credentials. */
export function _resetClientsForTests(): void {
  driveAuth = null;
  calendarAuth = null;
}
