export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceSentEmail } from '@/lib/email/invoiceEmails';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT', sentAt: new Date() },
      include: { items: true, payments: true },
    });

    const serialized = serializeInvoice(invoice, { forOutboundEmail: true });
    const emailResult = await sendInvoiceSentEmail(serialized);

    return NextResponse.json({
      success: true,
      invoice: serialized,
      email: emailResult,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to send invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
