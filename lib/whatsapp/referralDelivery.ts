import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type WhatsAppDeliveryAccounting =
  | 'delivery_confirmed'
  | 'failed'
  | 'accepted';

/** Map a Meta status webhook value onto the statuses this app records. */
export function whatsAppDeliveryStatus(providerStatus: string | null | undefined): WhatsAppDeliveryAccounting | null {
  const status = (providerStatus || '').toLowerCase();
  if (status === 'delivered' || status === 'read') return 'delivery_confirmed';
  if (status === 'failed') return 'failed';
  if (status === 'sent') return 'accepted';
  return null;
}

/**
 * Maps a Meta delivery receipt. Not called by the WhatsApp webhook.
 * That route still logs receipts and has unrelated Job relation and status
 * type errors, so delivery tracking is not active.
 */
export async function recordReferralDeliveryStatus(input: {
  providerMessageId?: string | null;
  providerStatus?: string | null;
}): Promise<number> {
  const providerMessageId = input.providerMessageId?.trim();
  const deliveryStatus = whatsAppDeliveryStatus(input.providerStatus);
  if (!providerMessageId || !deliveryStatus) return 0;

  const matches = await prisma.auditLog.findMany({
    where: {
      action: 'REFERRAL_NUDGE_SENT',
      entityType: 'Job',
      changes: {
        path: ['providerMessageId'],
        equals: providerMessageId,
      },
    },
    select: { id: true, changes: true },
    take: 5,
  });

  let updated = 0;
  for (const row of matches) {
    const prior =
      row.changes && typeof row.changes === 'object' && !Array.isArray(row.changes)
        ? (row.changes as Record<string, unknown>)
        : {};
    await prisma.auditLog.update({
      where: { id: row.id },
      data: {
        changes: {
          ...prior,
          providerMessageId,
          deliveryStatus,
        } as Prisma.InputJsonValue,
      },
    });
    updated += 1;
  }
  return updated;
}
