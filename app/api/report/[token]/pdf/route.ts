export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  serializeCompletionReport,
  renderCompletionReportHtml,
} from '@/lib/billing/serializeCompletionReport';

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

  const serialized = serializeCompletionReport(report);
  const html = renderCompletionReportHtml(serialized);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="completion-report-${report.reportNumber}.html"`,
    },
  });
}
