import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DispatchError } from '../errors';

const offerFindUnique = vi.fn();
const offerCreate = vi.fn();
const offerUpdate = vi.fn();
const sendCleanerOfferEmail = vi.fn();
const logIntegrationEvent = vi.fn();
const logAuditEntry = vi.fn();
const createAdminNotification = vi.fn();
const sendWhatsAppTemplate = vi.fn();
const sendWhatsAppMessage = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobOffer: {
      findUnique: (...args: unknown[]) => offerFindUnique(...args),
      create: (...args: unknown[]) => offerCreate(...args),
      update: (...args: unknown[]) => offerUpdate(...args),
    },
  },
}));

vi.mock('@/lib/dispatch/sendCleanerOfferEmail', () => ({
  sendCleanerOfferEmail: (...args: unknown[]) => sendCleanerOfferEmail(...args),
}));

vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: (...args: unknown[]) => logIntegrationEvent(...args),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => logAuditEntry(...args),
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...args: unknown[]) => createAdminNotification(...args),
  adminNotificationHelpers: { adminJobLink: (id: string) => `/admin/jobs/${id}` },
}));

vi.mock('@/lib/whatsapp', () => ({
  sendWhatsAppTemplate: (...args: unknown[]) => sendWhatsAppTemplate(...args),
}));

vi.mock('@/lib/whatsapp/sendMessage', () => ({
  sendWhatsAppMessage: (...args: unknown[]) => sendWhatsAppMessage(...args),
}));

import { resendOfferNotification } from '../resendOfferNotification';

const offeredAt = new Date('2026-09-08T12:00:00.000Z');
const expiresAt = new Date('2099-01-15T16:00:00.000Z');

function liveOffer(overrides: Record<string, unknown> = {}) {
  const { Job: jobPart, Cleaner: cleanerPart, ...rest } = overrides;
  const jobOverrides = (jobPart as Record<string, unknown> | undefined) ?? {};
  const cleanerOverrides = (cleanerPart as Record<string, unknown> | undefined) ?? {};
  return {
    id: 'offer-1',
    jobId: 'job-1',
    cleanerId: 'cleaner-1',
    status: 'OFFERED',
    offeredAt,
    expiresAt,
    compensationAmount: 180,
    compensationCurrency: 'USD',
    compensationBasis: 'FLAT' as const,
    estimatedDurationMins: 180,
    Cleaner: {
      id: 'cleaner-1',
      name: 'Test Cleaner',
      email: 'cleaner@example.test',
      role: 'CLEANER',
      ...cleanerOverrides,
    },
    Job: {
      id: 'job-1',
      assignedCleanerId: null,
      jobReference: 'VM-TEST-1',
      serviceType: 'Standard clean',
      preferredDate: new Date('2026-10-04T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceLocation: 'Burlington',
      Property: { city: 'Burlington', state: 'VT' },
      ...jobOverrides,
    },
    ...rest,
  };
}

describe('resendOfferNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindUnique.mockResolvedValue(liveOffer());
    sendCleanerOfferEmail.mockResolvedValue({ sent: true, id: 'email-1' });
    logIntegrationEvent.mockResolvedValue(undefined);
    logAuditEntry.mockResolvedValue('audit-1');
  });

  it('resends a live offer without changing terms or creating a duplicate', async () => {
    const result = await resendOfferNotification({
      jobId: 'job-1',
      offerId: 'offer-1',
      adminId: 'admin-1',
    });

    expect(result.offer.id).toBe('offer-1');
    expect(result.offer.cleanerId).toBe('cleaner-1');
    expect(result.offer.compensationAmount).toBe(180);
    expect(result.offer.compensationBasis).toBe('FLAT');
    expect(result.offer.offeredAt).toEqual(offeredAt);
    expect(result.offer.expiresAt).toEqual(expiresAt);
    expect(result.notification.sent).toBe(true);

    expect(sendCleanerOfferEmail).toHaveBeenCalledTimes(1);
    expect(sendCleanerOfferEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        cleanerEmail: 'cleaner@example.test',
        compensationAmount: 180,
        compensationBasis: 'FLAT',
        expiresAt,
        jobId: 'job-1',
      })
    );
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        action: 'SEND_CLEANER_OFFER_EMAIL',
        provider: 'RESEND',
        status: 'SUCCESS',
        triggeredBy: 'admin',
      })
    );
    expect(offerCreate).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
    expect(createAdminNotification).not.toHaveBeenCalled();
    expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('logs a failed send without mutating the offer', async () => {
    sendCleanerOfferEmail.mockResolvedValue({
      sent: false,
      error: 'RESEND_API_KEY not configured',
    });

    const result = await resendOfferNotification({
      jobId: 'job-1',
      offerId: 'offer-1',
      adminId: 'admin-1',
    });

    expect(result.notification.sent).toBe(false);
    expect(result.offer.id).toBe('offer-1');
    expect(result.offer.compensationAmount).toBe(180);
    expect(result.offer.expiresAt).toEqual(expiresAt);
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SEND_CLEANER_OFFER_EMAIL',
        status: 'FAILED',
        errorSummary: 'RESEND_API_KEY not configured',
      })
    );
    expect(offerCreate).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it('records a Preview/staging block without mutating the offer', async () => {
    sendCleanerOfferEmail.mockResolvedValue({
      sent: false,
      error: 'staging_notifications_disabled',
    });

    const result = await resendOfferNotification({
      jobId: 'job-1',
      offerId: 'offer-1',
    });

    expect(result.notification.sent).toBe(false);
    expect(result.notification.error).toBe('staging_notifications_disabled');
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorSummary: 'staging_notifications_disabled',
      })
    );
    expect(offerUpdate).not.toHaveBeenCalled();
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it('rejects an expired offer', async () => {
    offerFindUnique.mockResolvedValue(
      liveOffer({
        status: 'OFFERED',
        expiresAt: new Date('2026-09-01T00:00:00.000Z'),
      })
    );

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'OFFER_EXPIRED', status: 409 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it('rejects an accepted offer', async () => {
    offerFindUnique.mockResolvedValue(liveOffer({ status: 'ACCEPTED' }));

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'OFFER_ACCEPTED', status: 409 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it('rejects a declined offer', async () => {
    offerFindUnique.mockResolvedValue(liveOffer({ status: 'DECLINED' }));

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'OFFER_DECLINED', status: 409 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
  });

  it('rejects a cancelled offer', async () => {
    offerFindUnique.mockResolvedValue(liveOffer({ status: 'CANCELLED' }));

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'OFFER_CANCELLED', status: 409 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
  });

  it('rejects when the job is already assigned', async () => {
    offerFindUnique.mockResolvedValue(
      liveOffer({ Job: { assignedCleanerId: 'cleaner-1' } })
    );

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'ALREADY_ASSIGNED', status: 409 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it('rejects a mismatched job/offer pair', async () => {
    offerFindUnique.mockResolvedValue(liveOffer({ jobId: 'other-job' }));

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'offer-1' })
    ).rejects.toMatchObject({ code: 'OFFER_NOT_FOUND', status: 404 });
    expect(sendCleanerOfferEmail).not.toHaveBeenCalled();
  });

  it('rejects a missing offer', async () => {
    offerFindUnique.mockResolvedValue(null);

    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'missing' })
    ).rejects.toBeInstanceOf(DispatchError);
    await expect(
      resendOfferNotification({ jobId: 'job-1', offerId: 'missing' })
    ).rejects.toMatchObject({ code: 'OFFER_NOT_FOUND', status: 404 });
  });
});
