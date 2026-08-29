export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { cancelJobOffer } from '@/lib/dispatch/jobOffer';
import { isDispatchError } from '@/lib/dispatch/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string; offerId: string } }
) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const offer = await cancelJobOffer({
      jobId: params.jobId,
      offerId: params.offerId,
      adminId: admin.userId,
    });
    return NextResponse.json({
      success: true,
      offer: { id: offer.id, status: offer.status },
      message: 'Offer cancelled. Job is cleaner needed.',
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
    const message = err instanceof Error ? err.message : 'Failed to cancel offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
