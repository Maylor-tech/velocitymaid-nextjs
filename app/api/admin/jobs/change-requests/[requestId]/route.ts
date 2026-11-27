export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { ChangeRequestError, decideChangeRequest } from '@/lib/admin/changeRequests';

/** POST { action: 'approve' | 'decline', note? } */
export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = await request.json().catch(() => ({}));
    const action = body?.action === 'approve' ? 'approve' : body?.action === 'decline' ? 'decline' : null;
    if (!action) {
      return NextResponse.json({ success: false, error: 'action must be approve or decline' }, { status: 400 });
    }
    const result = await decideChangeRequest({
      id: params.requestId,
      action,
      note: typeof body?.note === 'string' ? body.note : null,
      actorId: auth.userId,
      branchIds: auth.isBranchScoped ? auth.branchIds ?? [] : undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (error instanceof ChangeRequestError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[admin/jobs/change-requests POST]', error);
    return NextResponse.json({ success: false, error: 'Could not save the decision' }, { status: 500 });
  }
}
