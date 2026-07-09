/**
 * Subscription upsell — one-time WhatsApp after 2+ completed jobs or one 5⭐ rating.
 * Skip if already subscribed. Uses audit log to prevent duplicate sends.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';
import { getSubscriptionByCustomerId } from '@/utils/subscriptionData';

const ACTION = 'SUBSCRIPTION_PROMPT_SENT';

// Subscription billing is deprioritized (recurring-plan tracking is an in-memory
// prototype, and /customer/subscriptions is 404'd in production) — disabled until
// that feature is actually built. Set ENABLE_SUBSCRIPTION_UPSELL=true to re-enable.
const SUBSCRIPTION_UPSELL_ENABLED = process.env.ENABLE_SUBSCRIPTION_UPSELL === 'true';

/**
 * If the customer is eligible (≥2 completed jobs in branch or any 5⭐ rating)
 * and not already prompted/subscribed, send subscription upsell WhatsApp.
 * Call after job is set to COMPLETED. Fire-and-forget; never throws.
 */
export async function sendSubscriptionUpsellIfEligible(jobId: string): Promise<void> {
  if (!SUBSCRIPTION_UPSELL_ENABLED) return;
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerId: true,
        branchId: true,
        status: true,
        Customer: { select: { phone: true } },
      },
    });
    if (!job?.customerId) return;
    const status = String(job.status || '').toUpperCase();
    if (status !== 'COMPLETED') return;

    const sub = getSubscriptionByCustomerId(job.customerId);
    if (sub && (sub.status === 'active' || sub.status === 'trialing')) return;

    const alreadySent = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Customer',
        entityId: job.customerId,
      },
    });
    if (alreadySent) return;

    const [completedCount, hasFiveStar] = await Promise.all([
      prisma.job.count({
        where: {
          customerId: job.customerId,
          branchId: job.branchId,
          status: 'COMPLETED',
        },
      }),
      prisma.cleanerRating.findFirst({
        where: {
          Job: { customerId: job.customerId },
          rating: 5,
        },
        select: { id: true },
      }),
    ]);

    if (completedCount < 2 && !hasFiveStar) return;

    const phone = job.Customer?.phone?.trim();
    if (!phone) return;

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(
      /\/$/,
      ''
    );
    const subscriptionLink = `${baseUrl}/customer/subscriptions`;

    const message = [
      '🔁 Make cleaning effortless!',
      '',
      'Save time and money with our recurring plan:',
      '• Weekly / Bi-weekly / Monthly',
      '• Priority scheduling',
      '• Subscriber savings',
      '',
      'Set it up here:',
      subscriptionLink,
      '',
      '— VelocityMaid',
    ].join('\n');

    sendWhatsAppMessage({ to: phone, message }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Customer',
      entityId: job.customerId,
      description: 'Subscription upsell WhatsApp sent',
      changes: { jobId, completedCount },
    });
  } catch (err) {
    console.error('[subscriptionUpsell]', err);
  }
}
