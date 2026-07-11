/**
 * Tests the two independent gates that must both pass before any Drive/
 * Calendar call fires: complete env config, and the admin-controlled
 * enable/disable toggle. Covers "missing credentials" and the kill switch
 * from the Phase 1 test plan.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSettings } = vi.hoisted(() => ({
  mockSettings: { googleDriveConnected: false, googleCalendarConnected: false } as {
    googleDriveConnected: boolean;
    googleCalendarConnected: boolean;
  },
}));

vi.mock('../../prisma', () => ({
  prisma: {
    adminPlatformSettings: {
      upsert: vi.fn(async () => ({ id: 'default', ...mockSettings })),
    },
  },
}));

import {
  hasCompleteDriveEnvConfig,
  hasCompleteCalendarEnvConfig,
  isDriveEnabled,
  isCalendarEnabled,
} from '../config';

const ENV_KEYS = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'GOOGLE_SHARED_DRIVE_ID',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  'GOOGLE_OPERATIONS_CALENDAR_ID',
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe('Google Workspace config gating', () => {
  beforeEach(() => {
    clearEnv();
    mockSettings.googleDriveConnected = false;
    mockSettings.googleCalendarConnected = false;
  });

  it('reports Drive not configured when any required env var is missing', () => {
    expect(hasCompleteDriveEnvConfig()).toBe(false);
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'svc@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-key';
    process.env.GOOGLE_SHARED_DRIVE_ID = 'drive-123';
    // GOOGLE_DRIVE_ROOT_FOLDER_ID intentionally left unset
    expect(hasCompleteDriveEnvConfig()).toBe(false);
  });

  it('reports Drive configured only when every required env var is present', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'svc@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-key';
    process.env.GOOGLE_SHARED_DRIVE_ID = 'drive-123';
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = 'folder-123';
    expect(hasCompleteDriveEnvConfig()).toBe(true);
  });

  it('reports Calendar configured only when its required env vars are present', () => {
    expect(hasCompleteCalendarEnvConfig()).toBe(false);
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'svc@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-key';
    process.env.GOOGLE_OPERATIONS_CALENDAR_ID = 'cal-123';
    expect(hasCompleteCalendarEnvConfig()).toBe(true);
  });

  it('isDriveEnabled is false when env is complete but the admin toggle is off (kill switch)', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'svc@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-key';
    process.env.GOOGLE_SHARED_DRIVE_ID = 'drive-123';
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = 'folder-123';
    mockSettings.googleDriveConnected = false;

    expect(await isDriveEnabled()).toBe(false);
  });

  it('isDriveEnabled is true only when both env is complete AND the toggle is on', async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'svc@test.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-key';
    process.env.GOOGLE_SHARED_DRIVE_ID = 'drive-123';
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = 'folder-123';
    mockSettings.googleDriveConnected = true;

    expect(await isDriveEnabled()).toBe(true);
  });

  it('isCalendarEnabled is false when the toggle is on but env is incomplete', async () => {
    mockSettings.googleCalendarConnected = true;
    // No env vars set at all
    expect(await isCalendarEnabled()).toBe(false);
  });
});
