export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { decimalToNumber, formatUsd, formatInvoiceDate } from '@/lib/invoices/invoiceUtils';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payments = await prisma.invoicePayment.findMany({
      where: {
        Invoice: {
          OR: [
            { customerId: session.customerId },
            { Job: { customerId: session.customerId } },
          ],
        },
      },
      include: {
        Invoice: { select: { invoiceNumber: true, propertyAddress: true, serviceType: true } },
        Receipt: { select: { publicToken: true, receiptNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        amount: decimalToNumber(p.amount),
        amountFormatted: formatUsd(decimalToNumber(p.amount)),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate.toISOString(),
        paymentDateFormatted: formatInvoiceDate(p.paymentDate),
        invoiceNumber: p.Invoice.invoiceNumber,
        propertyAddress: p.Invoice.propertyAddress,
        serviceType: p.Invoice.serviceType,
        receiptToken: p.Receipt?.publicToken ?? null,
        receiptNumber: p.Receipt?.receiptNumber ?? null,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load payment history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
