export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { sendRecordedInvoiceReminder, REMINDABLE_STATUSES } from '@/lib/invoices/sendReminder';
import { inReminderSendWindow, reminderStage, reminderCandidates } from '@/lib/invoices/reminderPolicy';

/** Expanded stages are opt-in; deploying this code alone cannot activate them. */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;
    const now = new Date();
    if (!inReminderSendWindow(now)) return NextResponse.json({ success: true, skipped: 'Outside customer send window' });
    const expanded = process.env.INVOICE_REMINDER_STAGES_ENABLED === 'true';
    const legacyCutoff = new Date(now);
    legacyCutoff.setUTCHours(0, 0, 0, 0);
    legacyCutoff.setUTCDate(legacyCutoff.getUTCDate() - 7);
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: REMINDABLE_STATUSES }, balanceDue: { gt: 0 },
        clientEmail: { not: null }, remindersPaused: false,
        ...(expanded
          ? { OR: reminderCandidates(now) }
          : { dueDate: { lt: legacyCutoff }, reminderSentAt: null }),
      },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }], take: 100,
    });
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    for (const invoice of invoices) {
      const stage = expanded ? reminderStage(invoice.dueDate, now) : 'legacy_overdue';
      if (!stage) { skipped++; continue; }
      const result = await sendRecordedInvoiceReminder(invoice.id, { triggeredBy: 'cron', stage, now });
      if (result.sent) sent++;
      else if (result.failed) failed++;
      else skipped++;
    }
    return NextResponse.json({ success: true, processed: invoices.length, sent, failed, skipped, expanded });
  } catch (error) {
    console.error('[invoice-reminders]', error);
    return NextResponse.json({ success: false, error: 'Invoice reminder processing failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) { return GET(request); }
