/**
 * Cleaner appreciation note — one WhatsApp per cleaner per week after a 5⭐ review.
 * Uses audit log to prevent duplicate sends in the same week.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'CLEANER_APPRECIATION_SENT';

/** ISO week key (Monday date YYYY-MM-DD) for current week in UTC. */
function getCurrentWeekKey(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * If the cleaner hasn't received an appreciation message this week, send one.
 * Call when a 5⭐ rating is saved (API or WhatsApp feedback). Fire-and-forget; never throws.
 */
export async function sendCleanerAppreciationIfEligible(cleanerId: string): Promise<void> {
  try {
    const weekKey = getCurrentWeekKey();

    const alreadySent = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'User',
        entityId: cleanerId,
        changes: { equals: { weekKey } },
      },
    });
    if (alreadySent) return;

    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      select: { id: true, name: true, phone: true },
    });
    if (!cleaner?.phone?.trim()) return;

    const cleanerName = cleaner.name || 'there';
    const message = [
      `👏 Great work, ${cleanerName}!`,
      '',
      'You received a 5-star review this week. Thank you for the excellent service you provide.',
      '',
      '— VelocityMaid',
    ].join('\n');

    sendWhatsAppMessage({ to: cleaner.phone.trim(), message }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'User',
      entityId: cleanerId,
      description: 'Cleaner appreciation WhatsApp sent (5⭐ review)',
      changes: { weekKey },
    });
  } catch (err) {
    console.error('[cleanerAppreciation]', err);
  }
}
