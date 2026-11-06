import { createHash } from 'node:crypto';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from './serializeInvoice';
import { contactDate } from './reminderPolicy';
import { sendInvoiceReminderEmail } from '@/lib/email/invoiceEmails';

export const REMINDABLE_STATUSES: InvoiceStatus[] = ['SENT', 'OVERDUE', 'PARTIALLY_PAID'];
export const INVOICE_REMINDER_SENDING_DISABLED_MESSAGE =
  'Invoice reminder sending is disabled. No email was sent.';

/** Exact opt-in. Unset, false, and any other value keep provider sends off. */
export function isInvoiceReminderSendingEnabled(): boolean {
  return process.env.INVOICE_REMINDER_SENDING_ENABLED === 'true';
}
const DAY = 86_400_000;
const messages: Record<string, string> = {
  due_soon: 'your invoice is due tomorrow.',
  due_today: 'your invoice is due today.',
  overdue_1: 'your invoice is past its payment due date.',
  overdue_7: 'your invoice remains overdue. Please pay or reply about any billing concern.',
  legacy_overdue: 'your invoice remains overdue. Please pay or reply about any billing concern.',
};

function eligible(invoice: { status: InvoiceStatus; remindersPaused: boolean; clientEmail: string | null; balanceDue: unknown }) {
  return REMINDABLE_STATUSES.includes(invoice.status) && !invoice.remindersPaused &&
    !!invoice.clientEmail?.trim() && Number(invoice.balanceDue) > 0;
}

export async function sendRecordedInvoiceReminder(
  invoiceId: string,
  options: { triggeredBy: 'admin' | 'cron'; stage?: string; now?: Date }
): Promise<{ sent: boolean; disabled?: boolean; skippedReason?: string; deliveryUnknown?: boolean; messageId?: string; failed?: boolean }> {
  if (!isInvoiceReminderSendingEnabled()) {
    return { sent: false, disabled: true, skippedReason: INVOICE_REMINDER_SENDING_DISABLED_MESSAGE };
  }
  const now = options.now ?? new Date();
  const day = contactDate(now);
  const stage = options.stage ?? `manual:${day}`;
  const cutoff = new Date(now.getTime() - DAY);
  const initial = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!initial || !eligible(initial)) return { sent: false, skippedReason: 'Invoice not eligible or reminders paused' };
  const recipientEmail = initial.clientEmail!.trim().toLowerCase();
  let deliveryId: string;
  try {
    const claim = await prisma.$transaction(async (tx) => {
      // Serializes claims across invoices for a recipient, without holding a
      // database transaction open during the email provider call.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${recipientEmail})::bigint)`;
      const recentInvoice = await tx.invoice.findFirst({ where: {
        clientEmail: { equals: recipientEmail, mode: 'insensitive' }, reminderSentAt: { gt: cutoff },
      } });
      const recentDelivery = await tx.invoiceReminderDelivery.findFirst({ where: {
        recipientEmail, OR: [
          { status: { in: ['PENDING', 'UNKNOWN'] } },
          { updatedAt: { gt: cutoff }, status: { in: ['SENT', 'EXTERNAL'] } },
        ],
      } });
      if (recentInvoice || recentDelivery) return null;
      const existing = await tx.invoiceReminderDelivery.findUnique({ where: { invoiceId_stage: { invoiceId, stage } } });
      if (existing) {
        if (existing.status !== 'FAILED' || existing.updatedAt > cutoff) return null;
        return tx.invoiceReminderDelivery.update({ where: { id: existing.id }, data: {
          status: 'PENDING', contactDate: day, recipientEmail, errorSummary: null,
        } });
      }
      return tx.invoiceReminderDelivery.create({ data: { invoiceId, stage, recipientEmail, contactDate: day } });
    });
    if (!claim) return { sent: false, skippedReason: 'Reminder already recorded or recipient cooldown' };
    deliveryId = claim.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { sent: false, skippedReason: 'Reminder already claimed for this stage or contact day' };
    }
    throw error;
  }
  const current = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, payments: true } });
  if (!current || !eligible(current) || current.clientEmail!.trim().toLowerCase() !== recipientEmail) {
    await prisma.invoiceReminderDelivery.update({ where: { id: deliveryId }, data: { status: 'SKIPPED' } });
    return { sent: false, skippedReason: 'Invoice or recipient changed before send' };
  }
  const serialized = serializeInvoice(current, { forOutboundEmail: true });
  if (serialized.balanceDue <= 0) {
    await prisma.invoiceReminderDelivery.update({ where: { id: deliveryId }, data: { status: 'SKIPPED' } });
    return { sent: false, skippedReason: 'Invoice paid before send' };
  }
  const idempotencyKey = `invoice-reminder-${createHash('sha256').update(deliveryId).digest('hex')}`;
  const result = await sendInvoiceReminderEmail(serialized, {
    idempotencyKey, message: messages[stage], triggeredBy: options.triggeredBy,
  });
  if (!result.sent) {
    await prisma.invoiceReminderDelivery.update({ where: { id: deliveryId }, data: {
      status: result.deliveryUnknown ? 'UNKNOWN' : 'FAILED',
      errorSummary: result.error ?? result.skippedReason ?? 'Email was not accepted',
    } });
    return { sent: false, failed: true, deliveryUnknown: result.deliveryUnknown };
  }
  // Failed post-send writes leave PENDING for reconciliation, never a blind retry.
  await prisma.$transaction([
    prisma.invoiceReminderDelivery.update({ where: { id: deliveryId }, data: { status: 'SENT', providerMessageId: result.messageId } }),
    prisma.invoice.update({ where: { id: invoiceId }, data: { reminderSentAt: now } }),
  ]);
  return { sent: true, messageId: result.messageId };
}
