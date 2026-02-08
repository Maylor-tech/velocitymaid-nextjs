/**
 * Service Pause Notice — sent when a customer pauses their subscription/service.
 * Uses audit cooldown to avoid duplicate on re-pause or double-submit; skips if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'SERVICE_PAUSE_NOTICE_SENT';
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

const MESSAGE = [
  '⏸️ Service Paused',
  '',
  'Your VelocityMaid service has been paused.',
  'You can resume anytime from your account.',
  '',
  '— VelocityMaid',
].join('\n');

/**
 * Send service pause notice to customer. At most one per subscription per cooldown window.
 * Returns true if message was sent, false if skipped.
 */
export async function sendServicePauseNotice(params: {
  customerId: string;
  subscriptionId: string;
}): Promise<boolean> {
  const { customerId, subscriptionId } = params;

  try {
    const since = new Date(Date.now() - COOLDOWN_MS);
    const recent = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Subscription',
        entityId: subscriptionId,
        createdAt: { gte: since },
      },
    });
    if (recent) return false;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, phone: true },
    });
    if (!customer?.phone?.trim()) return false;

    sendWhatsAppMessage({
      to: customer.phone.trim(),
      message: MESSAGE,
    }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Subscription',
      entityId: subscriptionId,
      description: 'Service pause notice sent to customer',
      changes: { sentAt: new Date().toISOString(), customerId },
    });
    return true;
  } catch (err) {
    console.error('[servicePauseNotice]', err);
    return false;
  }
}
