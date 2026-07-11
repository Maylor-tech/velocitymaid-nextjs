import { prisma } from '@/lib/prisma';
import {
  hasCompleteDriveEnvConfig,
  hasCompleteCalendarEnvConfig,
  readGoogleEnvConfig,
} from '@/lib/google/config';

export interface GoogleIntegrationStatus {
  drive: {
    envConfigured: boolean;
    enabled: boolean;
    rootFolderId: string | null;
  };
  calendar: {
    envConfigured: boolean;
    enabled: boolean;
    calendarId: string | null;
  };
  senderEmail: string;
  lastSyncError: string | null;
  lastSyncErrorAt: string | null;
}

/** Read-only display email — Resend continues to own all outbound mail (Decision 2). */
function currentSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'VelocityMaid <no-reply@velocitymaid.com>';
}

export async function getGoogleIntegrationStatus(): Promise<GoogleIntegrationStatus> {
  const env = readGoogleEnvConfig();
  const settings = await prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  return {
    drive: {
      envConfigured: hasCompleteDriveEnvConfig(),
      enabled: settings.googleDriveConnected,
      rootFolderId: settings.googleDriveRootFolderId || env.driveRootFolderId,
    },
    calendar: {
      envConfigured: hasCompleteCalendarEnvConfig(),
      enabled: settings.googleCalendarConnected,
      calendarId: settings.googleCalendarId || env.operationsCalendarId,
    },
    senderEmail: currentSenderEmail(),
    lastSyncError: settings.lastSyncError,
    lastSyncErrorAt: settings.lastSyncErrorAt ? settings.lastSyncErrorAt.toISOString() : null,
  };
}

export interface UpdateGoogleIntegrationInput {
  driveEnabled?: boolean;
  calendarEnabled?: boolean;
}

/** Enable/disable toggles only — the actual folder/calendar IDs are env-configured infrastructure, not a runtime setting. */
export async function updateGoogleIntegrationSettings(
  input: UpdateGoogleIntegrationInput
): Promise<GoogleIntegrationStatus> {
  await prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...(input.driveEnabled !== undefined ? { googleDriveConnected: input.driveEnabled } : {}),
      ...(input.calendarEnabled !== undefined ? { googleCalendarConnected: input.calendarEnabled } : {}),
    },
    update: {
      ...(input.driveEnabled !== undefined ? { googleDriveConnected: input.driveEnabled } : {}),
      ...(input.calendarEnabled !== undefined ? { googleCalendarConnected: input.calendarEnabled } : {}),
    },
  });
  return getGoogleIntegrationStatus();
}
