export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { resendOfferNotification } from '@/lib/dispatch/resendOfferNotification';
import { isDispatchError } from '@/lib/dispatch/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string; offerId: string } }
) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const result = await resendOfferNotification({
      jobId: params.jobId,
      offerId: params.offerId,
      adminId: admin.userId,
    });
    return NextResponse.json({
      success: true,
      offer: {
        id: result.offer.id,
        cleanerId: result.offer.cleanerId,
        compensationAmount: result.offer.compensationAmount,
        compensationBasis: result.offer.compensationBasis,
        offeredAt: result.offer.offeredAt.toISOString(),
        expiresAt: result.offer.expiresAt.toISOString(),
      },
      notification: {
        sent: result.notification.sent,
        error: result.notification.error ?? null,
      },
      message: result.notification.sent
        ? 'Offer notification resent. Offer terms are unchanged.'
        : 'Notification attempt recorded. Offer terms are unchanged.',
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
    const message = err instanceof Error ? err.message : 'Failed to resend notification';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
