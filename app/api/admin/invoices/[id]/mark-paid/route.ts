export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { recordInvoicePayment, finalizeInvoicePayment } from '@/lib/invoices/invoiceService';
import { decimalToNumber } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceReceiptEmail } from '@/lib/email/invoiceEmails';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const balance = decimalToNumber(invoice.balanceDue);
    if (balance <= 0) {
      return NextResponse.json({ success: false, error: 'Invoice is already paid' }, { status: 400 });
    }

    const payment = await recordInvoicePayment({
      invoiceId: params.id,
      amount: balance,
      paymentMethod: 'OTHER',
      notes: 'Marked paid by admin',
    });

    const updated = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    const serialized = serializeInvoice(updated!);
    await sendInvoiceReceiptEmail(serialized, balance);
    await finalizeInvoicePayment(params.id, payment.id, balance);

    return NextResponse.json({ success: true, invoice: serialized });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to mark paid';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
