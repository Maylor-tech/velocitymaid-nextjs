/**
 * Loyalty credit — grant one-time credit after N completed jobs (e.g. 3).
 * Uses audit log to prevent duplicate grants; WhatsApp optional.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'LOYALTY_CREDIT_GRANTED';
const DEFAULT_THRESHOLD = 3;
const DEFAULT_AMOUNT = 20;

/**
 * If the customer has just hit the completed-job threshold for the branch,
 * grant one loyalty credit (ReferralCredit) and send WhatsApp. Call after job
 * is set to COMPLETED. Fire-and-forget; never throws.
 */
export async function grantLoyaltyCreditIfEligible(jobId: string): Promise<void> {
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

    const threshold =
      typeof process.env.LOYALTY_CREDIT_THRESHOLD !== 'undefined'
        ? parseInt(process.env.LOYALTY_CREDIT_THRESHOLD, 10)
        : DEFAULT_THRESHOLD;
    const amount =
      typeof process.env.LOYALTY_CREDIT_AMOUNT !== 'undefined'
        ? parseFloat(process.env.LOYALTY_CREDIT_AMOUNT)
        : DEFAULT_AMOUNT;
    if (threshold < 1 || amount <= 0) return;

    const completedCount = await prisma.job.count({
      where: {
        customerId: job.customerId,
        branchId: job.branchId,
        status: 'COMPLETED',
      },
    });
    if (completedCount < threshold) return;

    const alreadyGranted = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Customer',
        entityId: job.customerId,
        changes: { equals: { branchId: job.branchId } },
      },
    });
    if (alreadyGranted) return;

    const now = new Date();
    await prisma.referralCredit.create({
      data: {
        id: randomUUID(),
        customerId: job.customerId,
        referralLinkId: null,
        amount,
        status: 'PENDING',
        appliedToJobId: null,
        expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      },
    });

    await logAuditEntry({
      action: ACTION,
      entityType: 'Customer',
      entityId: job.customerId,
      description: `Loyalty credit granted after ${completedCount} completed jobs`,
      changes: { branchId: job.branchId },
    });

    const phone = job.Customer?.phone?.trim();
    if (phone) {
      const message = [
        '🎉 Loyalty Reward Unlocked!',
        '',
        `You've earned a $${Number(amount).toFixed(2)} credit for your next clean.`,
        "It's already applied—just book when ready.",
        '',
        '— VelocityMaid',
      ].join('\n');
      sendWhatsAppMessage({ to: phone, message }).catch(() => {});
    }
  } catch (err) {
    console.error('[loyaltyCredit]', err);
  }
}
