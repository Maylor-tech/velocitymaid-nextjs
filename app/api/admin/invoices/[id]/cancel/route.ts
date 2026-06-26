export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'CANCELLED', updatedAt: new Date() },
      include: { items: true, payments: true },
    });
    return NextResponse.json({ success: true, invoice: serializeInvoice(invoice) });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to cancel invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
