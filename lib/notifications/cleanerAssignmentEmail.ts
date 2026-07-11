/**
 * Orchestrates the cleaner-assignment email: loads what's needed from a
 * jobId, sends it, and logs the attempt. Never throws — call sites use
 * .catch(() => {}) the same way the existing WhatsApp send does.
 */
import { prisma } from '@/lib/prisma';
import { sendCleanerAssignmentEmail } from '@/lib/email/sendCleanerAssignmentEmail';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import { createAdminNotification, adminNotificationHelpers } from '@/lib/notifications/adminNotificationCenter';

function formatDate(date: Date | null): string {
  if (!date) return 'TBD';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const PAY_METHOD_LABELS: Record<string, string> = {
  ZELLE: 'Zelle',
  CASH: 'Cash',
  BANK: 'Bank transfer',
  CASH_APP: 'Cash App',
  CHECK: 'Check',
  PAYPAL: 'PayPal',
};

export async function notifyCleanerOfAssignmentByEmail(jobId: string): Promise<void> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobReference: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        assignedCleanerId: true,
        User: { select: { id: true, name: true, email: true } },
      },
    });
    if (!job?.User) return;

    await createAdminNotification({
      type: 'CLEANER_ASSIGNED',
      severity: 'INFO',
      message: `${job.User.name || 'A cleaner'} was assigned to ${job.jobReference || job.id}`,
      jobId: job.id,
      actionUrl: adminNotificationHelpers.adminJobLink(job.id),
    });

    if (!job.User.email) return;

    const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
      where: { cleanerId: job.User.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { methodType: true, label: true },
    });
    const payMethodLabel = paymentMethod
      ? paymentMethod.label || PAY_METHOD_LABELS[paymentMethod.methodType] || paymentMethod.methodType
      : null;

    const result = await sendCleanerAssignmentEmail({
      cleanerEmail: job.User.email,
      cleanerName: job.User.name || 'there',
      jobReference: job.jobReference,
      serviceType: job.serviceType || 'Cleaning',
      scheduledDate: formatDate(job.preferredDate),
      scheduledTime: job.preferredTime || 'TBD',
      address: job.address || 'See cleaner portal',
      payMethodLabel,
      jobId: job.id,
    });

    await logIntegrationEvent({
      jobId: job.id,
      channel: 'EMAIL',
      action: 'SEND_CLEANER_ASSIGNMENT_EMAIL',
      provider: 'RESEND',
      status: result.sent ? 'SUCCESS' : 'FAILED',
      recipient: job.User.email,
      templateKey: 'cleaner_assignment',
      triggeredBy: 'system',
      errorSummary: result.sent ? null : result.error,
    });
  } catch (err) {
    console.error('[notifyCleanerOfAssignmentByEmail] Unexpected error:', err);
  }
}
