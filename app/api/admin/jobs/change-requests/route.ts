export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { listChangeRequests } from '@/lib/admin/changeRequests';

/** GET ?status=PENDING|ALL&jobId=…: client change requests from the portal. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const sp = request.nextUrl.searchParams;
    const requests = await listChangeRequests({
      status: sp.get('status') === 'ALL' ? 'ALL' : 'PENDING',
      jobId: sp.get('jobId') || undefined,
      branchIds: auth.isBranchScoped ? auth.branchIds ?? [] : undefined,
    });
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[admin/jobs/change-requests GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load change requests' }, { status: 500 });
  }
}
