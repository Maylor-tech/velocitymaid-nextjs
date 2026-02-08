/**
 * Account Update Notice — sent when customer account details are updated.
 * Uses audit cooldown to avoid duplicate on double-submit; skips if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'ACCOUNT_UPDATE_NOTICE_SENT';
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

const MESSAGE = [
  '🔔 Account Update Confirmed',
  '',
  'Your account information has been updated successfully.',
  "If you didn't make this change, please contact us.",
  '',
  '— VelocityMaid',
].join('\n');

/**
 * Send account update notice to customer. At most one per customer per cooldown window.
 * Returns true if message was sent, false if skipped.
 */
export async function sendAccountUpdateNotice(customerId: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - COOLDOWN_MS);
    const recent = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Customer',
        entityId: customerId,
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
      entityType: 'Customer',
      entityId: customer.id,
      description: 'Account update notice sent',
      changes: { sentAt: new Date().toISOString() },
    });
    return true;
  } catch (err) {
    console.error('[accountUpdateNotice]', err);
    return false;
  }
}
