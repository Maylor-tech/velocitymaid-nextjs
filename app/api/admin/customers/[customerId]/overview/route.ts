export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { getCustomerOverview } from '@/lib/admin/customerOverview';

/** GET: jobs, properties (with calendar sync), invoices and totals for one customer. */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const exists = await prisma.customer.findUnique({
      where: { id: params.customerId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }
    const overview = await getCustomerOverview(params.customerId);
    return NextResponse.json({ success: true, overview });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load customer overview';
    const status = message.includes('Unauthorized') ? 401 : 500;
    if (status === 500) console.error('[admin/customers/overview]', error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
