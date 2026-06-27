export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeReceipt } from '@/lib/billing/serializeReceipt';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const receipts = await prisma.receipt.findMany({
      where: { customerId: session.customerId },
      orderBy: { paymentDate: 'desc' },
      take: 50,
    });
    return NextResponse.json({
      success: true,
      receipts: receipts.map(serializeReceipt),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load receipts';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
