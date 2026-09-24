/**
 * Guest feedback ops alert — never throws; no host/cleaner recipients.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAdminNotification: vi.fn(),
  logIntegrationEvent: vi.fn(),
  resendSend: vi.fn(),
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...a: unknown[]) =>
    mocks.createAdminNotification(...a),
  adminNotificationHelpers: {
    adminJobLink: (id: string) => `https://www.velocitymaid.com/admin/jobs/${id}`,
  },
}));

vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: (...a: unknown[]) => mocks.logIntegrationEvent(...a),
}));

vi.mock('@/lib/email/resendClient', () => ({
  getResendFromEmail: () => 'VelocityMaid <hello@velocitymaid.com>',
  resend: {
    emails: { send: (...a: unknown[]) => mocks.resendSend(...a) },
  },
}));

import { notifyGuestFeedbackOpsAlert } from '@/lib/feedback/notifyGuestFeedbackOps';

describe('notifyGuestFeedbackOpsAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminNotification.mockResolvedValue({
      ok: true,
      created: true,
      id: 'n1',
    });
    mocks.logIntegrationEvent.mockResolvedValue(undefined);
    mocks.resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  it('creates WARNING admin notification + ops email for CONCERN', async () => {
    const result = await notifyGuestFeedbackOpsAlert({
      feedbackId: 'fb-1',
      jobId: 'job-1',
      jobReference: 'VM-2026-0001',
      propertyGuestDisplayName: "Lou Lou's Landing",
      propertyId: 'prop-1',
      opsClass: 'CONCERN',
      issueTopic: 'cleaning',
      overallRating: 2,
      cleanlinessRating: 2,
      comment: 'Bathroom not cleaned',
      submittedAt: new Date('2026-09-24T12:00:00.000Z'),
    });

    expect(result.adminNotificationOk).toBe(true);
    expect(result.emailSent).toBe(true);
    expect(mocks.createAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'JOB_ISSUE_REPORTED',
        severity: 'WARNING',
        jobId: 'job-1',
        actionUrl: expect.stringContaining('/admin/feedback/fb-1'),
      })
    );
    const emailArg = mocks.resendSend.mock.calls[0][0];
    expect(emailArg.to).toBe('hello@velocitymaid.com');
    expect(emailArg.subject).toMatch(/CONCERN/);
    expect(emailArg.html).toContain('Lou Lou&#39;s Landing');
    expect(emailArg.html).not.toMatch(/guestAccessToken|\/stay\/[A-Za-z0-9_-]{16,}/);
  });

  it('uses CRITICAL severity for URGENT', async () => {
    await notifyGuestFeedbackOpsAlert({
      feedbackId: 'fb-2',
      jobId: 'job-2',
      jobReference: null,
      propertyGuestDisplayName: 'Mountain Joie Retreat',
      propertyId: null,
      opsClass: 'URGENT',
      issueTopic: 'attention',
      overallRating: 4,
      cleanlinessRating: 4,
      comment: 'Water leak under sink',
      submittedAt: new Date(),
    });
    expect(mocks.createAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'CRITICAL' })
    );
  });

  it('still succeeds when email fails', async () => {
    mocks.resendSend.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });
    const result = await notifyGuestFeedbackOpsAlert({
      feedbackId: 'fb-3',
      jobId: 'job-3',
      jobReference: 'VM-1',
      propertyGuestDisplayName: 'Chipman Park Stay',
      propertyId: 'p',
      opsClass: 'CONCERN',
      issueTopic: null,
      overallRating: 3,
      cleanlinessRating: 3,
      comment: null,
      submittedAt: new Date(),
    });
    expect(result.adminNotificationOk).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.emailSkippedReason).toMatch(/boom/);
  });

  it('still succeeds when admin notification fails', async () => {
    mocks.createAdminNotification.mockResolvedValue({
      ok: false,
      created: false,
      id: null,
      error: 'db down',
    });
    const result = await notifyGuestFeedbackOpsAlert({
      feedbackId: 'fb-4',
      jobId: 'job-4',
      jobReference: null,
      propertyGuestDisplayName: 'this property',
      propertyId: null,
      opsClass: 'CONCERN',
      issueTopic: 'cleaning',
      overallRating: 2,
      cleanlinessRating: 2,
      comment: 'x',
      submittedAt: new Date(),
    });
    expect(result.adminNotificationOk).toBe(false);
    expect(result.emailSent).toBe(true);
  });
});
