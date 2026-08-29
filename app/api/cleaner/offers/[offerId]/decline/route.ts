export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { declineJobOffer } from '@/lib/dispatch/jobOffer';
import { isDispatchError } from '@/lib/dispatch/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    let reason: string | null = null;
    try {
      const body = await request.json();
      reason = typeof body.reason === 'string' ? body.reason : null;
    } catch {
      reason = null;
    }
    const result = await declineJobOffer({
      offerId: params.offerId,
      cleanerId: auth.userId,
      reason,
    });
    return NextResponse.json({
      success: true,
      ...result,
      message: 'Offer declined.',
    });
  } catch (err) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    if (isDispatchError(err)) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to decline offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
