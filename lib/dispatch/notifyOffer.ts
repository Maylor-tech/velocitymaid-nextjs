import { prisma } from '@/lib/prisma';
import { sendCleanerOfferEmail } from '@/lib/dispatch/sendCleanerOfferEmail';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import {
  createAdminNotification,
  adminNotificationHelpers,
} from '@/lib/notifications/adminNotificationCenter';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { toCleanerOfferLocationView } from '@/lib/dispatch/cleanerViews';

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

    const location = toCleanerOfferLocationView({
      serviceLocation: offer.Job.serviceLocation,
      property: offer.Job.Property,
    });

    await createAdminNotification({
      type: 'CLEANER_OFFERED',
      severity: 'INFO',
      message: `Offer sent to ${offer.Cleaner.name || 'a cleaner'} for ${offer.Job.jobReference || offer.jobId}`,
      jobId: offer.jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(offer.jobId),
    });

    if (!offer.Cleaner.email) return;

    const result = await sendCleanerOfferEmail({
      cleanerEmail: offer.Cleaner.email,
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
      expiresAt: offer.expiresAt,
      jobId: offer.jobId,
      estimatedDurationMins: offer.estimatedDurationMins,
    });

    await logIntegrationEvent({
      jobId: offer.jobId,
      channel: 'EMAIL',
      action: 'SEND_CLEANER_OFFER_EMAIL',
      provider: 'RESEND',
      status: result.sent ? 'SUCCESS' : 'FAILED',
      recipient: offer.Cleaner.email,
      templateKey: 'cleaner_offer',
      triggeredBy: 'admin',
      errorSummary: result.sent ? null : result.error,
    });
  } catch (err) {
    console.error('[notifyCleanerOfOffer] Unexpected error:', err);
  }
}
