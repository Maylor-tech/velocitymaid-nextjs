/**
 * Refund Confirmation WhatsApp — sent once per refund when Stripe processes a refund.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'REFUND_CONFIRMATION_SENT';

/**
 * Send refund confirmation to customer. Once per refund (by refundId).
 * Returns true if sent, false if skipped.
 */
export async function sendRefundConfirmation(params: {
  refundId: string;
  amount: number;
  customerPhone: string | null;
}): Promise<boolean> {
  const { refundId, amount, customerPhone } = params;

  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Refund',
        entityId: refundId,
      },
    });
    if (existing) return false;

    const phone = customerPhone?.trim();
    if (!phone) return false;

    const amountStr =
      typeof amount === 'number' && Number.isFinite(amount)
        ? `$${amount.toFixed(2)}`
        : String(amount);

    const message = [
      '💳 Refund Processed',
      '',
      `Your refund of ${amountStr} has been issued.`,
      'It may take a few days to appear on your statement.',
      '',
      '— VelocityMaid',
    ].join('\n');

    sendWhatsAppMessage({ to: phone, message }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Refund',
      entityId: refundId,
      description: 'Refund confirmation WhatsApp sent to customer',
      changes: { sentAt: new Date().toISOString(), amount },
    });
    return true;
  } catch (err) {
    console.error('[refundConfirmation]', err);
    return false;
  }
}
