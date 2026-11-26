export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { voidMistakenCompletion, VoidCompletionError } from '@/lib/admin/voidMistakenCompletion';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';

/** POST { reason }: owner-only. Undo a completion made by mistake (no payout, no money received). */
export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    if (auth.branchId || auth.isBranchScoped) {
      return NextResponse.json(
        { success: false, error: 'Only the owner account can undo a completed job.' },
        { status: 403 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const result = await voidMistakenCompletion({
      jobId: params.jobId,
      reason: typeof body?.reason === 'string' ? body.reason : '',
      actorId: auth.userId,
      actorEmail: auth.email ?? null,
    });
    await awaitJobCalendarCancel(params.jobId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (error instanceof VoidCompletionError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('[admin/jobs/void-completion]', error);
    return NextResponse.json({ success: false, error: 'Could not undo the completion' }, { status: 500 });
  }
}
