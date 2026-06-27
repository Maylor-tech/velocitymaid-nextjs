export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import type { InvoicePaymentMethod } from '@prisma/client';
import { recordInvoicePayment, finalizeInvoicePayment } from '@/lib/invoices/invoiceService';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceReceiptEmail } from '@/lib/email/invoiceEmails';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod as InvoicePaymentMethod;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });
    }
    const validMethods: InvoicePaymentMethod[] = [
      'CASH', 'CHECK', 'STRIPE', 'ZELLE', 'VENMO', 'BANK_TRANSFER', 'OTHER',
    ];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    const payment = await recordInvoicePayment({
      invoiceId: params.id,
      amount,
      paymentMethod,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      transactionReference: body.transactionReference,
      notes: body.notes,
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    const serialized = serializeInvoice(invoice!);
    await sendInvoiceReceiptEmail(serialized, amount);
    await finalizeInvoicePayment(params.id, payment.id, amount);

    return NextResponse.json({ success: true, invoice: serialized });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
