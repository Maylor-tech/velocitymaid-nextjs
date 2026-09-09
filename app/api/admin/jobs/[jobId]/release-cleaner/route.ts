export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { isDispatchError } from '@/lib/dispatch/errors';
import {
  canMutateDispatchOffers,
  dispatchMutationBlockReason,
} from '@/lib/dispatch/environmentSafety';
import { releaseAssignedCleaner } from '@/lib/dispatch/releaseAssignment';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    if (!canMutateDispatchOffers()) {
      return NextResponse.json(
        {
          success: false,
          error: dispatchMutationBlockReason(),
          code: 'STAGING_DB_REQUIRED',
        },
        { status: 409 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      expectedCleanerId?: string;
      reason?: string;
      notes?: string;
    };

    const result = await releaseAssignedCleaner({
      jobId: params.jobId,
      expectedCleanerId: body.expectedCleanerId ?? null,
      reason: body.reason,
      notes: body.notes ?? null,
      adminId: admin.userId,
    });

    return NextResponse.json({
      success: true,
      job: {
        id: result.job.id,
        status: result.job.status,
        assignedCleanerId: result.job.assignedCleanerId,
        paymentStatus: result.job.paymentStatus,
      },
      offer: result.offer
        ? {
            id: result.offer.id,
            status: result.offer.status,
            cleanerId: result.offer.cleanerId,
            compensationAmount: result.offer.compensationAmount,
            compensationBasis: result.offer.compensationBasis,
            offeredAt: result.offer.offeredAt.toISOString(),
            expiresAt: result.offer.expiresAt.toISOString(),
          }
        : null,
      release: result.release,
      message:
        'Cleaner released. Accepted offer and assignment history are preserved. Job is Cleaner Needed.',
    });
  } catch (err) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    if (isDispatchError(err)) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to release cleaner';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
