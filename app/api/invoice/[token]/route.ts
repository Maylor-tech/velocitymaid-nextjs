export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshInvoiceStatus } from '@/lib/invoices/invoiceService';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import {
  getServiceInvoiceZelleDestination,
  SERVICE_INVOICE_ZELLE_SECONDARY,
} from '@/lib/tips/zelleDestination';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: params.token },
      include: { items: true, payments: true },
    });
    if (!invoice || invoice.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    await refreshInvoiceStatus(invoice.id);
    const refreshed = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true, payments: true },
    });

    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
    const zelle = getServiceInvoiceZelleDestination();

    return NextResponse.json({
      success: true,
      invoice: serializeInvoice(refreshed!),
      stripeConfigured,
      zelle: {
        label: zelle.label,
        handle: zelle.handle,
        secondaryText: SERVICE_INVOICE_ZELLE_SECONDARY,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
