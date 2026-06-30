export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Invoice Overdue Reminders (Cron)
 * GET /api/cron/invoice-reminders
 *
 * Sends one friendly overdue reminder for SENT invoices 7+ days past due.
 * Schedule: daily 9:00 AM UTC (vercel.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { sendInvoiceOverdueReminderEmail } from '@/lib/email/cronAutomationEmails';

const MAX_PER_RUN = 100;

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
        status: InvoiceStatus.SENT,
        dueDate: { lt: sevenDaysAgo },
        reminderSentAt: null,
        clientEmail: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: MAX_PER_RUN,
    });

    let sent = 0;
    let failed = 0;

    for (const invoice of overdue) {
      if (!invoice.clientEmail || !invoice.dueDate) continue;

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
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } else {
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
