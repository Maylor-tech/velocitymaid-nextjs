export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { refreshInvoiceStatus } from '@/lib/invoices/invoiceService';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceReminderEmail } from '@/lib/email/invoiceEmails';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    await refreshInvoiceStatus(params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const serialized = serializeInvoice(invoice);
    if (serialized.balanceDue <= 0) {
      return NextResponse.json({ success: false, error: 'Invoice has no balance due' }, { status: 400 });
    }

    const emailResult = await sendInvoiceReminderEmail(serialized);
    return NextResponse.json({ success: true, email: emailResult });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to send reminder';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
