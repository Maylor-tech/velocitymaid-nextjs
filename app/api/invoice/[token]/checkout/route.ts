export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { decimalToNumber } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Online payments are not configured' },
        { status: 503 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: params.token },
      include: { items: true, payments: true },
    });
    if (!invoice || invoice.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const balance = decimalToNumber(invoice.balanceDue);
    if (balance <= 0) {
      return NextResponse.json({ success: false, error: 'Nothing due on this invoice' }, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const stripe = getStripe();
    const serialized = serializeInvoice(invoice);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VelocityMaid Invoice ${invoice.invoiceNumber}`,
              description: invoice.serviceType,
            },
            unit_amount: Math.round(balance * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/invoice/${params.token}?paid=1`,
      cancel_url: `${origin}/invoice/${params.token}`,
      customer_email: invoice.clientEmail || undefined,
      metadata: {
        paymentType: 'billing_invoice',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return NextResponse.json({ success: true, url: session.url, invoice: serialized });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
