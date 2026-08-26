/**
 * Host Add Cleaning side effects: ops HOST_CLEANING_REQUEST + Request Received email.
 * Awaited in-request so Vercel does not freeze before the writes complete.
 * Never throws — Job HTTP success must not depend on email or notification.
 */
import { sendHostRequestReceivedEmail } from '@/lib/email/sendHostRequestReceivedEmail';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import { prisma } from '@/lib/prisma';
import {
  adminNotificationHelpers,
  createAdminNotification,
  type CreateAdminNotificationResult,
} from '@/lib/notifications/adminNotificationCenter';

export const HOST_REQUEST_RECEIVED_EMAIL_ACTION = 'SEND_HOST_REQUEST_RECEIVED_EMAIL';
export const HOST_REQUEST_RECEIVED_TEMPLATE = 'host_request_received';

export type HostRequestEmailNotifyResult = {
  sent: boolean;
  skipped: boolean;
  skippedReason?: string;
  provider?: 'RESEND';
  messageId?: string | null;
};

export type HostCleaningRequestNotifyResult = {
  opsAlert: CreateAdminNotificationResult & { type: 'HOST_CLEANING_REQUEST' };
  email: HostRequestEmailNotifyResult;
};

export type HostCleaningRequestNotifyInput = {
  jobId: string;
  jobReference: string | null;
  customerName: string;
  customerEmail: string;
  customerFirstName: string;
  propertyName?: string | null;
  address: string;
  preferredDate: Date | string | null;
  preferredTime: string | null;
  serviceType: string;
};

export async function notifyHostCleaningRequestCreated(
  input: HostCleaningRequestNotifyInput
): Promise<HostCleaningRequestNotifyResult> {
  const opsAlert = await createAdminNotification({
    type: 'HOST_CLEANING_REQUEST',
    severity: 'INFO',
    message: `Host cleaning request ${input.jobReference || input.jobId} — ${input.customerName} · ${input.address}`,
    jobId: input.jobId,
    actionUrl: adminNotificationHelpers.adminJobLink(input.jobId),
    idempotent: true,
  });

  if (opsAlert.ok) {
    console.log('[hostCleaningRequestNotify] opsAlert', {
      jobId: input.jobId,
      id: opsAlert.id,
      created: opsAlert.created,
    });
  } else {
    console.error('[hostCleaningRequestNotify] opsAlert failed', {
      jobId: input.jobId,
      error: opsAlert.error,
    });
  }

  const email = await sendHostRequestReceivedIfNeeded(input);
  return {
    opsAlert: { ...opsAlert, type: 'HOST_CLEANING_REQUEST' },
    email,
  };
}

async function sendHostRequestReceivedIfNeeded(
  input: HostCleaningRequestNotifyInput
): Promise<HostRequestEmailNotifyResult> {
  const prior = await prisma.integrationEventLog.findFirst({
    where: {
      jobId: input.jobId,
      action: HOST_REQUEST_RECEIVED_EMAIL_ACTION,
      status: 'SUCCESS',
    },
    select: { id: true },
  });
  if (prior) {
    console.log('[hostCleaningRequestNotify] email already sent', {
      jobId: input.jobId,
      logId: prior.id,
    });
    return {
      sent: true,
      skipped: true,
      skippedReason: 'already sent',
      provider: 'RESEND',
      messageId: null,
    };
  }

  const result = await sendHostRequestReceivedEmail({
    to: input.customerEmail,
    customerFirstName: input.customerFirstName,
    propertyName: input.propertyName,
    address: input.address,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    serviceType: input.serviceType,
    jobReference: input.jobReference,
    jobId: input.jobId,
  });

  await logIntegrationEvent({
    jobId: input.jobId,
    channel: 'EMAIL',
    action: HOST_REQUEST_RECEIVED_EMAIL_ACTION,
    provider: 'RESEND',
    status: result.sent ? 'SUCCESS' : 'FAILED',
    recipient: input.customerEmail || null,
    templateKey: HOST_REQUEST_RECEIVED_TEMPLATE,
    triggeredBy: 'system',
    errorSummary: result.sent
      ? result.messageId
        ? `messageId=${result.messageId}`
        : null
      : result.skippedReason ?? 'Send failed',
  });

  if (result.sent) {
    console.log('[hostCleaningRequestNotify] email', {
      jobId: input.jobId,
      sent: true,
      messageId: result.messageId ?? null,
    });
  } else {
    console.error('[hostCleaningRequestNotify] email failed', {
      jobId: input.jobId,
      skippedReason: result.skippedReason,
    });
  }

  return {
    sent: result.sent,
    skipped: false,
    skippedReason: result.skippedReason,
    provider: 'RESEND',
    messageId: result.messageId ?? null,
  };
}
