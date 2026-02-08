/**
 * "We've Arrived" WhatsApp — sent once per job when cleaner checks in.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'ARRIVAL_NOTIFICATION_SENT';

/**
 * Send "We've arrived" to customer if not already sent for this job.
 * Call after check-in (onTheWayAt set). Fire-and-forget; never throws.
 */
export async function sendArrivalNotificationIfNeeded(jobId: string): Promise<void> {
  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Job',
        entityId: jobId,
      },
    });
    if (existing) return;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        Customer: { select: { phone: true } },
        User: { select: { name: true } },
      },
    });
    if (!job?.Customer?.phone?.trim()) return;

    const cleanerName = job.User?.name || 'Your cleaner';
    const message = [
      '🧹 We\'ve arrived!',
      '',
      `Your cleaner ${cleanerName} is on site and getting started.`,
      '',
      'Thanks for choosing VelocityMaid.',
    ].join('\n');

    sendWhatsAppMessage({
      to: job.Customer.phone.trim(),
      message,
    }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Job',
      entityId: job.id,
      description: 'Arrival WhatsApp sent to customer',
      changes: { sentAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[arrivalWhatsApp]', err);
  }
}
