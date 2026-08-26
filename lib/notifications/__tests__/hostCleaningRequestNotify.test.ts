import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAdminNotification = vi.fn();
const sendHostRequestReceivedEmail = vi.fn();
const logIntegrationEvent = vi.fn();
const findEmailLog = vi.fn();

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...a: unknown[]) => createAdminNotification(...a),
  adminNotificationHelpers: {
    adminJobLink: (id: string) => `https://velocitymaid.com/admin/jobs/${id}`,
  },
}));

vi.mock('@/lib/email/sendHostRequestReceivedEmail', () => ({
  sendHostRequestReceivedEmail: (...a: unknown[]) => sendHostRequestReceivedEmail(...a),
}));

vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: (...a: unknown[]) => logIntegrationEvent(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    integrationEventLog: {
      findFirst: (...a: unknown[]) => findEmailLog(...a),
    },
  },
}));

import {
  HOST_REQUEST_RECEIVED_EMAIL_ACTION,
  notifyHostCleaningRequestCreated,
} from '../hostCleaningRequestNotify';

const input = {
  jobId: 'job-1',
  jobReference: 'VM-2026-0029',
  customerName: 'Chris Ray Hautchamp',
  customerEmail: 'hautchamp26@gmail.com',
  customerFirstName: 'Chris Ray',
  propertyName: '198 Chipman Park',
  address: '198 Chipman Park',
  preferredDate: new Date('2026-12-08T00:00:00.000Z'),
  preferredTime: '10:00 AM',
  serviceType: 'Property Walkthrough',
};

describe('notifyHostCleaningRequestCreated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findEmailLog.mockResolvedValue(null);
    createAdminNotification.mockResolvedValue({
      ok: true,
      created: true,
      id: 'notif-1',
    });
    sendHostRequestReceivedEmail.mockResolvedValue({
      sent: true,
      provider: 'RESEND',
      messageId: 're_msg_1',
    });
    logIntegrationEvent.mockResolvedValue(undefined);
  });

  it('creates exactly one HOST_CLEANING_REQUEST and sends the receipt email', async () => {
    const result = await notifyHostCleaningRequestCreated(input);

    expect(createAdminNotification).toHaveBeenCalledTimes(1);
    expect(createAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HOST_CLEANING_REQUEST',
        jobId: 'job-1',
        idempotent: true,
      })
    );
    expect(sendHostRequestReceivedEmail).toHaveBeenCalledTimes(1);
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        action: HOST_REQUEST_RECEIVED_EMAIL_ACTION,
        status: 'SUCCESS',
        provider: 'RESEND',
      })
    );
    expect(result.opsAlert).toMatchObject({
      type: 'HOST_CLEANING_REQUEST',
      ok: true,
      created: true,
      id: 'notif-1',
    });
    expect(result.email).toMatchObject({
      sent: true,
      skipped: false,
      messageId: 're_msg_1',
    });
  });

  it('surfaces notification failure operationally and still attempts email', async () => {
    createAdminNotification.mockResolvedValue({
      ok: false,
      created: false,
      id: null,
      error: 'db down',
    });

    const result = await notifyHostCleaningRequestCreated(input);

    expect(result.opsAlert.ok).toBe(false);
    expect(result.opsAlert.error).toBe('db down');
    expect(sendHostRequestReceivedEmail).toHaveBeenCalledTimes(1);
    expect(result.email.sent).toBe(true);
  });

  it('does not throw when email fails', async () => {
    sendHostRequestReceivedEmail.mockResolvedValue({
      sent: false,
      skippedReason: 'Resend 500',
      provider: 'RESEND',
      messageId: null,
    });

    const result = await notifyHostCleaningRequestCreated(input);

    expect(result.opsAlert.ok).toBe(true);
    expect(result.email.sent).toBe(false);
    expect(result.email.skippedReason).toBe('Resend 500');
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorSummary: 'Resend 500',
      })
    );
  });

  it('does not duplicate ops alerts or receipt emails on retry of the same job', async () => {
    createAdminNotification.mockResolvedValue({
      ok: true,
      created: false,
      id: 'notif-1',
    });
    findEmailLog.mockResolvedValue({ id: 'log-1' });

    const result = await notifyHostCleaningRequestCreated(input);

    expect(createAdminNotification).toHaveBeenCalledTimes(1);
    expect(createAdminNotification.mock.calls[0][0].idempotent).toBe(true);
    expect(sendHostRequestReceivedEmail).not.toHaveBeenCalled();
    expect(logIntegrationEvent).not.toHaveBeenCalled();
    expect(result.opsAlert.created).toBe(false);
    expect(result.email).toMatchObject({
      sent: true,
      skipped: true,
      skippedReason: 'already sent',
    });
  });
});
