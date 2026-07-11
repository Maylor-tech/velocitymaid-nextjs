/**
 * Google Workspace integration config.
 *
 * Two independent gates must both be true before any Drive/Calendar call is
 * made: (1) the required env vars are present, and (2) the admin has
 * explicitly enabled the integration in AdminPlatformSettings (the "disable
 * individual integrations" kill switch) — configuring credentials alone
 * never turns anything on.
 */
import { prisma } from '@/lib/prisma';

export interface GoogleEnvConfig {
  serviceAccountEmail: string | null;
  hasPrivateKey: boolean;
  sharedDriveId: string | null;
  driveRootFolderId: string | null;
  operationsCalendarId: string | null;
}

export function readGoogleEnvConfig(): GoogleEnvConfig {
  return {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
    hasPrivateKey: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    sharedDriveId: process.env.GOOGLE_SHARED_DRIVE_ID || null,
    driveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
    operationsCalendarId: process.env.GOOGLE_OPERATIONS_CALENDAR_ID || null,
  };
}

export function hasCompleteDriveEnvConfig(): boolean {
  const c = readGoogleEnvConfig();
  return Boolean(c.serviceAccountEmail && c.hasPrivateKey && c.sharedDriveId && c.driveRootFolderId);
}

export function hasCompleteCalendarEnvConfig(): boolean {
  const c = readGoogleEnvConfig();
  return Boolean(c.serviceAccountEmail && c.hasPrivateKey && c.operationsCalendarId);
}

/** Singleton row — created on first read if it doesn't exist yet. */
export async function getIntegrationSettings() {
  return prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });
}

export async function isDriveEnabled(): Promise<boolean> {
  if (!hasCompleteDriveEnvConfig()) return false;
  const settings = await getIntegrationSettings();
  return settings.googleDriveConnected;
}

export async function isCalendarEnabled(): Promise<boolean> {
  if (!hasCompleteCalendarEnvConfig()) return false;
  const settings = await getIntegrationSettings();
  return settings.googleCalendarConnected;
}

export async function recordSyncError(message: string): Promise<void> {
  try {
    await prisma.adminPlatformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', lastSyncError: message, lastSyncErrorAt: new Date() },
      update: { lastSyncError: message, lastSyncErrorAt: new Date() },
    });
  } catch {
    // Never let logging failure break the calling flow.
  }
}
