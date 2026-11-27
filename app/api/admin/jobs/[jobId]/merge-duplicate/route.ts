export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { assertAdminJobRecord } from '@/lib/auth/adminJobAccess';
import { isDispatchError } from '@/lib/dispatch/errors';
import { listDuplicateCandidates, mergeDuplicateJob, MergeError } from '@/lib/admin/mergeDuplicateJob';

/** GET: other cleans at the same property within a week (possible duplicates). */
export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    await assertAdminJobRecord(auth, params.jobId);
    return NextResponse.json({ success: true, candidates: await listDuplicateCandidates(params.jobId) });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (isDispatchError(error)) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('[admin/jobs/merge-duplicate GET]', error);
    return NextResponse.json({ success: false, error: 'Could not look for duplicates' }, { status: 500 });
  }
}

/** POST { keepJobId }: cancel THIS clean as a duplicate of keepJobId. */
export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    await assertAdminJobRecord(auth, params.jobId);
    const body = await request.json().catch(() => ({}));
    if (typeof body?.keepJobId !== 'string') {
      return NextResponse.json({ success: false, error: 'keepJobId is required' }, { status: 400 });
    }
    await assertAdminJobRecord(auth, body.keepJobId);
    const result = await mergeDuplicateJob({ duplicateJobId: params.jobId, keepJobId: body.keepJobId, adminId: auth.userId });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (error instanceof MergeError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    if (isDispatchError(error)) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('[admin/jobs/merge-duplicate POST]', error);
    return NextResponse.json({ success: false, error: 'Could not merge' }, { status: 500 });
  }
}
