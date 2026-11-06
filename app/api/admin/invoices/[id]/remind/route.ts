export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { assertSuperAdmin, requireRole } from '@/lib/auth/requireRole';
import { refreshInvoiceStatus } from '@/lib/invoices/invoiceService';
import {
  INVOICE_REMINDER_SENDING_DISABLED_MESSAGE,
  isInvoiceReminderSendingEnabled,
  sendRecordedInvoiceReminder,
} from '@/lib/invoices/sendReminder';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    // Alias of assertOwnerAuthorization: the owner account, not branch count.
    assertSuperAdmin(auth);
    if (!isInvoiceReminderSendingEnabled()) {
      const email = {
        sent: false,
        disabled: true,
        skippedReason: INVOICE_REMINDER_SENDING_DISABLED_MESSAGE,
      };
      return NextResponse.json({ success: false, email, error: email.skippedReason }, { status: 409 });
    }
    await refreshInvoiceStatus(params.id);
    const emailResult = await sendRecordedInvoiceReminder(params.id, { triggeredBy: 'admin' });
    return NextResponse.json({ success: emailResult.sent, email: emailResult,
      error: emailResult.sent ? undefined : emailResult.skippedReason || 'Reminder delivery failed; review reminder history before retrying',
    }, {
      status: emailResult.sent ? 200 : emailResult.failed ? 502 : 409,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to send reminder';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
