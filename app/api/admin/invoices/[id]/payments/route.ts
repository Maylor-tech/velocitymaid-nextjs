export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import type { InvoicePaymentMethod } from '@prisma/client';
import {
  EXTERNAL_REF_REQUIRED_METHODS,
  recordInvoicePayment,
  finalizeInvoicePayment,
} from '@/lib/invoices/invoiceService';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { notifyInvoicePaymentConfirmation } from '@/lib/invoices/notifyPaymentConfirmation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod as InvoicePaymentMethod;
    const transactionReference =
      typeof body.transactionReference === 'string'
        ? body.transactionReference.trim()
        : undefined;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });
    }
    const validMethods: InvoicePaymentMethod[] = [
      'CASH', 'CHECK', 'STRIPE', 'ZELLE', 'VENMO', 'BANK_TRANSFER', 'OTHER',
    ];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }
    if (EXTERNAL_REF_REQUIRED_METHODS.has(paymentMethod) && !transactionReference) {
      return NextResponse.json(
        {
          success: false,
          error: `transactionReference is required for ${paymentMethod} payments`,
        },
        { status: 400 }
      );
    }

    const { payment, previousStatus, becamePaid, duplicate, clamped } =
      await recordInvoicePayment({
        invoiceId: params.id,
        amount,
        paymentMethod,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        transactionReference,
        notes: body.notes,
        actorId: auth.userId,
      });

    const creditedAmount = Number(payment.amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    const serialized = serializeInvoice(invoice!);
    if (becamePaid) {
      await notifyInvoicePaymentConfirmation(params.id, previousStatus, creditedAmount);
    }
    if (!duplicate) {
      await finalizeInvoicePayment(params.id, payment.id, creditedAmount);
    }

    return NextResponse.json({
      success: true,
      invoice: serialized,
      duplicate,
      clamped,
      paymentAmount: creditedAmount,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to record payment';
    const status = message.includes('required') || message.includes('already paid') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
