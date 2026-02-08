/**
 * Weather Delay Alert — sent once per job when admin marks job/area as weather-delayed.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'WEATHER_DELAY_ALERT_SENT';

const MESSAGE = [
  '🌧️ Weather Update from VelocityMaid',
  '',
  'Due to weather conditions, your cleaning may be delayed.',
  "We'll follow up shortly with the updated time.",
  '',
  'Thanks for your understanding.',
  '— VelocityMaid',
].join('\n');

/**
 * Send weather delay alert to the job's customer if not already sent for this job.
 * Returns true if message was sent, false if skipped (no phone, already sent, or job not found).
 */
export async function sendWeatherDelayAlertForJob(jobId: string): Promise<boolean> {
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
      description: 'Weather delay alert sent to customer',
      changes: { sentAt: new Date().toISOString() },
    });
    return true;
  } catch (err) {
    console.error('[weatherDelayAlert]', err);
    return false;
  }
}
