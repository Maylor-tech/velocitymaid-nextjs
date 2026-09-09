import { prisma } from '@/lib/prisma';
import { sendCleanerOfferEmail } from '@/lib/dispatch/sendCleanerOfferEmail';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import {
  createAdminNotification,
  adminNotificationHelpers,
} from '@/lib/notifications/adminNotificationCenter';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { toCleanerOfferLocationView } from '@/lib/dispatch/cleanerViews';
import { SEND_CLEANER_OFFER_EMAIL } from '@/lib/dispatch/offerNotification';

export type OfferEmailDeliveryResult = {
  sent: boolean;
  error?: string;
};

type OfferEmailSource = {
  jobId: string;
  compensationAmount: { toString(): string } | number;
  compensationCurrency: string;
  compensationBasis: 'FLAT' | 'HOURLY' | 'OTHER';
  expiresAt: Date;
  estimatedDurationMins?: number | null;
  Cleaner: { name: string | null; email: string | null };
  Job: {
    jobReference: string | null;
    serviceType: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    serviceLocation: string | null;
    Property: { city: string | null; state: string | null } | null;
  };
};

/**
 * Send the existing offer email and write SEND_CLEANER_OFFER_EMAIL.
 * Does not create or update JobOffer, extend TTL, or send WhatsApp.
 */
export async function deliverOfferEmailAndLog(
  offer: OfferEmailSource
): Promise<OfferEmailDeliveryResult> {
  const recipient = offer.Cleaner.email?.trim() || null;
  if (!recipient) {
    await logIntegrationEvent({
      jobId: offer.jobId,
      channel: 'EMAIL',
      action: SEND_CLEANER_OFFER_EMAIL,
      provider: 'RESEND',
      status: 'FAILED',
      recipient: null,
      templateKey: 'cleaner_offer',
      triggeredBy: 'admin',
      errorSummary: 'Cleaner has no email',
    });
    return { sent: false, error: 'Cleaner has no email' };
  }

  const location = toCleanerOfferLocationView({
    serviceLocation: offer.Job.serviceLocation,
    property: offer.Job.Property,
  });

  const result = await sendCleanerOfferEmail({
    cleanerEmail: recipient,
    cleanerName: offer.Cleaner.name || 'there',
    jobReference: offer.Job.jobReference,
    serviceType: offer.Job.serviceType || 'Cleaning',
    scheduledDate:
      formatServiceDate(offer.Job.preferredDate, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) || 'TBD',
    scheduledTime: offer.Job.preferredTime || 'TBD',
    locationLabel: location.areaLabel || 'See cleaner portal',
    compensationAmount: Number(offer.compensationAmount),
    compensationCurrency: offer.compensationCurrency,
    compensationBasis: offer.compensationBasis,
    expiresAt: offer.expiresAt,
    jobId: offer.jobId,
    estimatedDurationMins: offer.estimatedDurationMins,
  });

  await logIntegrationEvent({
    jobId: offer.jobId,
    channel: 'EMAIL',
    action: SEND_CLEANER_OFFER_EMAIL,
    provider: 'RESEND',
    status: result.sent ? 'SUCCESS' : 'FAILED',
    recipient,
    templateKey: 'cleaner_offer',
    triggeredBy: 'admin',
    errorSummary: result.sent ? null : result.error ?? null,
  });

  return { sent: result.sent, error: result.error };
}

export async function notifyCleanerOfOffer(offerId: string): Promise<void> {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        Cleaner: { select: { id: true, name: true, email: true } },
        Job: {
          select: {
            id: true,
            jobReference: true,
            serviceType: true,
            preferredDate: true,
            preferredTime: true,
            serviceLocation: true,
            Property: { select: { city: true, state: true } },
          },
        },
      },
    });
    if (!offer) return;

    await createAdminNotification({
      type: 'CLEANER_OFFERED',
      severity: 'INFO',
      message: `Offer sent to ${offer.Cleaner.name || 'a cleaner'} for ${offer.Job.jobReference || offer.jobId}`,
      jobId: offer.jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(offer.jobId),
    });

    await deliverOfferEmailAndLog(offer);
  } catch (err) {
    console.error('[notifyCleanerOfOffer] Unexpected error:', err);
  }
}
