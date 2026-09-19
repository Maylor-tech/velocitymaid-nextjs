import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus } from '@prisma/client';

const userFindUnique = vi.fn();
const jobFindUnique = vi.fn();
const logIntegrationEvent = vi.fn();
const sendCleanerCancellationEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
  },
}));

vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: (...a: unknown[]) => logIntegrationEvent(...a),
}));

vi.mock('@/lib/email/sendCleanerCancellationEmail', () => ({
  sendCleanerCancellationEmail: (...a: unknown[]) =>
    sendCleanerCancellationEmail(...a),
}));

import {
  CLEANER_CANCELLATION_TEMPLATE_KEY,
  SEND_CLEANER_CANCELLATION_EMAIL,
  notifyCleanerOfJobCancellation,
} from '../cleanerCancellationEmail';

describe('notifyCleanerOfJobCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobFindUnique.mockResolvedValue({
      id: 'job-oct4',
      jobReference: 'VM-2026-0028',
      serviceType: 'Turnover clean',
      preferredDate: new Date('2026-10-04T14:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceLocation: 'Ludlow',
      Property: { city: 'Ludlow', state: 'VT' },
      status: JobStatus.CANCELLED,
      assignedCleanerId: null,
    });
    userFindUnique.mockResolvedValue({
      id: 'user-dorottya',
      name: 'Dorottya',
      email: 'dorottya@example.com',
    });
    sendCleanerCancellationEmail.mockResolvedValue({ sent: true, id: 'email-1' });
    logIntegrationEvent.mockResolvedValue(undefined);
  });

  it('loads cleaner by releasedCleanerId and logs SUCCESS', async () => {
    const result = await notifyCleanerOfJobCancellation({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
    });

    expect(result.sent).toBe(true);
    expect(userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-dorottya' } })
    );
    expect(sendCleanerCancellationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        cleanerEmail: 'dorottya@example.com',
        jobReference: 'VM-2026-0028',
        serviceType: 'Turnover clean',
        locationLabel: 'Ludlow',
        jobId: 'job-oct4',
      })
    );
    const sendArgs = sendCleanerCancellationEmail.mock.calls[0][0];
    expect(JSON.stringify(sendArgs)).not.toMatch(
      /accessNotes|alarm|quotedTotal|totalPrice|compensation/i
    );
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-oct4',
        channel: 'EMAIL',
        action: SEND_CLEANER_CANCELLATION_EMAIL,
        provider: 'RESEND',
        status: 'SUCCESS',
        recipient: 'dorottya@example.com',
        templateKey: CLEANER_CANCELLATION_TEMPLATE_KEY,
        triggeredBy: 'system',
      })
    );
  });

  it('logs FAILED when Resend fails but does not throw', async () => {
    sendCleanerCancellationEmail.mockResolvedValue({
      sent: false,
      error: 'resend_down',
    });

    const result = await notifyCleanerOfJobCancellation({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
    });

    expect(result.sent).toBe(false);
    expect(result.error).toBe('resend_down');
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorSummary: 'resend_down',
      })
    );
  });

  it('logs FAILED when cleaner has no email and does not throw', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-dorottya',
      name: 'Dorottya',
      email: null,
    });

    const result = await notifyCleanerOfJobCancellation({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
    });

    expect(result.sent).toBe(false);
    expect(result.error).toBe('Cleaner has no email');
    expect(sendCleanerCancellationEmail).not.toHaveBeenCalled();
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        recipient: null,
        errorSummary: 'Cleaner has no email',
      })
    );
  });
});
