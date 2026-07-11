/**
 * Tests that logIntegrationEvent() centralizes the 3 "failed sync" admin
 * notification triggers (email/Drive/Calendar) — every failure passes
 * through this one function, so this is the single place that must get it
 * right rather than remembering it at each call site.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { logCalls, notificationCalls } = vi.hoisted(() => ({
  logCalls: [] as any[],
  notificationCalls: [] as any[],
}));

vi.mock('../../prisma', () => ({
  prisma: {
    integrationEventLog: {
      create: vi.fn(async ({ data }: any) => {
        logCalls.push(data);
        return data;
      }),
    },
  },
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: vi.fn(async (input: any) => {
    notificationCalls.push(input);
  }),
  adminNotificationHelpers: {
    adminJobLink: (jobId: string) => `https://velocitymaid.com/admin/jobs/${jobId}`,
  },
}));

import { logIntegrationEvent } from '../integrationLog';

describe('logIntegrationEvent', () => {
  beforeEach(() => {
    logCalls.length = 0;
    notificationCalls.length = 0;
  });

  it('always writes to IntegrationEventLog regardless of status', async () => {
    await logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_TEST_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      triggeredBy: 'system',
    });
    expect(logCalls).toHaveLength(1);
    expect(logCalls[0].status).toBe('SUCCESS');
  });

  it('does NOT create an admin notification on success', async () => {
    await logIntegrationEvent({
      channel: 'DRIVE',
      action: 'CREATE_DRIVE_FOLDER',
      provider: 'GOOGLE_DRIVE',
      status: 'SUCCESS',
      triggeredBy: 'system',
    });
    expect(notificationCalls).toHaveLength(0);
  });

  it.each([
    ['EMAIL', 'FAILED_EMAIL'],
    ['DRIVE', 'FAILED_DRIVE_SYNC'],
    ['CALENDAR', 'FAILED_CALENDAR_SYNC'],
  ] as const)('creates a %s notification of type %s on failure', async (channel, expectedType) => {
    await logIntegrationEvent({
      jobId: 'job-1',
      channel,
      action: 'SOME_ACTION',
      provider: 'SOME_PROVIDER',
      status: 'FAILED',
      triggeredBy: 'system',
      errorSummary: 'boom',
    });

    expect(notificationCalls).toHaveLength(1);
    expect(notificationCalls[0].type).toBe(expectedType);
    expect(notificationCalls[0].severity).toBe('WARNING');
    expect(notificationCalls[0].jobId).toBe('job-1');
    expect(notificationCalls[0].message).toContain('boom');
    expect(notificationCalls[0].actionUrl).toContain('job-1');
  });

  it('still writes the log entry even when the notification jobId is absent', async () => {
    await logIntegrationEvent({
      channel: 'CALENDAR',
      action: 'SYNC_CALENDAR_EVENT',
      provider: 'GOOGLE_CALENDAR',
      status: 'FAILED',
      triggeredBy: 'cron',
    });
    expect(notificationCalls[0].jobId).toBeNull();
    expect(notificationCalls[0].actionUrl).toBeNull();
  });
});
