/**
 * Orchestrates the cleaner cancellation email after a job cancel releases
 * an assigned cleaner. Never throws — cancellation must remain successful
 * even if email fails or the cleaner has no address.
 *
 * Pass cleanerId captured BEFORE assignment was cleared (e.g.
 * cancelCustomerJob().releasedCleanerId). Do not read Job.assignedCleanerId
 * after cancel — that field is intentionally null.
 */
import { prisma } from '@/lib/prisma';
import { sendCleanerCancellationEmail } from '@/lib/email/sendCleanerCancellationEmail';
import {
  logIntegrationEvent,
  type IntegrationTrigger,
} from '@/lib/google/integrationLog';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { toCleanerOfferLocationView } from '@/lib/dispatch/cleanerViews';

export const SEND_CLEANER_CANCELLATION_EMAIL = 'SEND_CLEANER_CANCELLATION_EMAIL';
export const CLEANER_CANCELLATION_TEMPLATE_KEY = 'cleaner_cancellation';

export type NotifyCleanerCancellationResult = {
  sent: boolean;
  error?: string;
};

export async function notifyCleanerOfJobCancellation(input: {
  jobId: string;
  cleanerId: string;
  triggeredBy?: IntegrationTrigger;
}): Promise<NotifyCleanerCancellationResult> {
  try {
    const cleanerId = input.cleanerId?.trim();
    if (!cleanerId) {
      return { sent: false, error: 'Missing cleaner id' };
    }

    const [cleaner, job] = await Promise.all([
      prisma.user.findUnique({
        where: { id: cleanerId },
        select: { id: true, name: true, email: true },
      }),
      prisma.job.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          jobReference: true,
          serviceType: true,
          preferredDate: true,
          preferredTime: true,
          serviceLocation: true,
          Property: { select: { city: true, state: true } },
        },
      }),
    ]);

    if (!job) {
      return { sent: false, error: 'Job not found' };
    }

    const recipient = cleaner?.email?.trim() || null;
    if (!recipient) {
      await logIntegrationEvent({
        jobId: job.id,
        channel: 'EMAIL',
        action: SEND_CLEANER_CANCELLATION_EMAIL,
        provider: 'RESEND',
        status: 'FAILED',
        recipient: null,
        templateKey: CLEANER_CANCELLATION_TEMPLATE_KEY,
        triggeredBy: input.triggeredBy || 'system',
        errorSummary: 'Cleaner has no email',
      });
      return { sent: false, error: 'Cleaner has no email' };
    }

    const location = toCleanerOfferLocationView({
      serviceLocation: job.serviceLocation,
      property: job.Property,
    });

    const result = await sendCleanerCancellationEmail({
      cleanerEmail: recipient,
      cleanerName: cleaner?.name || 'there',
      jobReference: job.jobReference,
      serviceType: job.serviceType || 'Cleaning',
      scheduledDate:
        formatServiceDate(job.preferredDate, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) || 'TBD',
      scheduledTime: job.preferredTime || 'TBD',
      locationLabel: location.areaLabel || 'See cleaner portal',
      jobId: job.id,
    });

    await logIntegrationEvent({
      jobId: job.id,
      channel: 'EMAIL',
      action: SEND_CLEANER_CANCELLATION_EMAIL,
      provider: 'RESEND',
      status: result.sent ? 'SUCCESS' : 'FAILED',
      recipient,
      templateKey: CLEANER_CANCELLATION_TEMPLATE_KEY,
      triggeredBy: input.triggeredBy || 'system',
      errorSummary: result.sent ? null : result.error ?? 'Send failed',
    });

    return {
      sent: result.sent,
      error: result.sent ? undefined : result.error,
    };
  } catch (err) {
    console.error('[notifyCleanerOfJobCancellation] Unexpected error:', err);
    try {
      await logIntegrationEvent({
        jobId: input.jobId,
        channel: 'EMAIL',
        action: SEND_CLEANER_CANCELLATION_EMAIL,
        provider: 'RESEND',
        status: 'FAILED',
        recipient: null,
        templateKey: CLEANER_CANCELLATION_TEMPLATE_KEY,
        triggeredBy: input.triggeredBy || 'system',
        errorSummary:
          err instanceof Error ? err.message : 'Unexpected cancellation email error',
      });
    } catch {
      // Logging must never surface through cancellation.
    }
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Unexpected cancellation email error',
    };
  }
}
