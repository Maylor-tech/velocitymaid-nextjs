export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Invoice Overdue Reminders (Cron)
 * GET /api/cron/invoice-reminders
 *
 * Sends one friendly overdue reminder for open invoices 7+ days past due.
 * Claim-before-send on reminderSentAt prevents double-send races.
 * Schedule: daily 9:00 AM UTC (vercel.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { sendInvoiceOverdueReminderEmail } from '@/lib/email/cronAutomationEmails';

const MAX_PER_RUN = 100;

const REMINDABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.OVERDUE,
  InvoiceStatus.PARTIALLY_PAID,
];

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdue = await prisma.invoice.findMany({
      where: {
        status: { in: REMINDABLE_STATUSES },
        dueDate: { lt: sevenDaysAgo },
        reminderSentAt: null,
        balanceDue: { gt: 0 },
        clientEmail: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: MAX_PER_RUN,
    });

    let sent = 0;
    let failed = 0;
    let skippedClaimed = 0;

    for (const invoice of overdue) {
      if (!invoice.clientEmail || !invoice.dueDate) continue;

      // Claim before send — exactly-once under concurrent cron runners.
      const claim = await prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          reminderSentAt: null,
          balanceDue: { gt: 0 },
          status: { in: REMINDABLE_STATUSES },
        },
        data: { reminderSentAt: new Date() },
      });

      if (claim.count !== 1) {
        skippedClaimed++;
        continue;
      }

      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysPastDue = Math.max(
        1,
        Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const result = await sendInvoiceOverdueReminderEmail({
        toEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.balanceDue),
        daysPastDue,
        serviceType: invoice.serviceType,
        jobDate: invoice.jobDate,
      });

      if (result.sent) {
        sent++;
      } else {
        // Release claim so a later run can retry after hard email failure.
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminderSentAt: null },
        });
        console.error(
          `[invoice-reminders] Failed for ${invoice.invoiceNumber}:`,
          result.error || result.skippedReason
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: overdue.length,
      sent,
      failed,
      skippedClaimed,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Invoice reminder cron failed';
    console.error('[invoice-reminders]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

// Re-export for tests
export const __test = {
  REMINDABLE_STATUSES,
  buildOverdueWhere: (sevenDaysAgo: Date): Prisma.InvoiceWhereInput => ({
    status: { in: REMINDABLE_STATUSES },
    dueDate: { lt: sevenDaysAgo },
    reminderSentAt: null,
    balanceDue: { gt: 0 },
    clientEmail: { not: null },
  }),
};
