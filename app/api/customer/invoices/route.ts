export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { customerId: session.customerId },
          { Job: { customerId: session.customerId } },
        ],
      },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({
      success: true,
      invoices: invoices.map(serializeInvoice),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load invoices';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
