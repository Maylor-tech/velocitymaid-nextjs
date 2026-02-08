/**
 * Emergency Cancellation Notice — sent once per job when admin marks as CANCELLED_EMERGENCY.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'EMERGENCY_CANCEL_NOTICE_SENT';

const MESSAGE = [
  '🚨 Service Update from VelocityMaid',
  '',
  'Due to an unexpected situation, your cleaning scheduled for today has been cancelled.',
  "We'll contact you shortly to reschedule.",
  '',
  'We apologize for the inconvenience.',
  '— VelocityMaid',
].join('\n');

/**
 * Send emergency cancellation notice to the job's customer if not already sent.
 * Returns true if message was sent, false if skipped.
 */
export async function sendEmergencyCancelNoticeForJob(jobId: string): Promise<boolean> {
  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Job',
        entityId: jobId,
      },
    });
    if (existing) return false;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        Customer: { select: { phone: true } },
      },
    });
    if (!job?.Customer?.phone?.trim()) return false;

    sendWhatsAppMessage({
      to: job.Customer.phone.trim(),
      message: MESSAGE,
    }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Job',
      entityId: job.id,
      description: 'Emergency cancellation notice sent to customer',
      changes: { sentAt: new Date().toISOString() },
    });
    return true;
  } catch (err) {
    console.error('[emergencyCancelNotice]', err);
    return false;
  }
}
