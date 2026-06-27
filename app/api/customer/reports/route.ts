export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeCompletionReport } from '@/lib/billing/serializeCompletionReport';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const reports = await prisma.completionReport.findMany({
      where: { Job: { customerId: session.customerId } },
      orderBy: { serviceDate: 'desc' },
      take: 50,
    });
    return NextResponse.json({
      success: true,
      reports: reports.map(serializeCompletionReport),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load reports';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
