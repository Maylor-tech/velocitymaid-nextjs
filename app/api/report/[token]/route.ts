export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { loadHostPhotoReport } from '@/lib/reports/loadHostPhotoReport';

const ROBOTS = { 'X-Robots-Tag': 'noindex, nofollow, noarchive' };

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const report = await loadHostPhotoReport(params.token);
  if (!report) {
    return NextResponse.json(
      { success: false, error: 'Report not found' },
      { status: 404, headers: ROBOTS }
    );
  }
  return NextResponse.json({ success: true, report }, { headers: ROBOTS });
}
