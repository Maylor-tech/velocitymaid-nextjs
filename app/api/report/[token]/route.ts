export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCompletionReport } from '@/lib/billing/serializeCompletionReport';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const report = await prisma.completionReport.findUnique({
    where: { publicToken: params.token },
  });
  if (!report) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, report: serializeCompletionReport(report) });
}
