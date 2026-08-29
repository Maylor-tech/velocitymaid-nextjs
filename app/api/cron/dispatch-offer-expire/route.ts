export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Expire outstanding JobOffers past expiresAt.
 * GET /api/cron/dispatch-offer-expire
 * Auth: Bearer CRON_SECRET
 * Schedule: daily 04:15 UTC on Vercel Hobby (sub-daily crons require Pro).
 * With DISPATCH_OFFERS_VERMONT off, JobOffer is empty so this is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { expireOpenOffers } from '@/lib/dispatch/jobOffer';

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const result = await expireOpenOffers();
    return NextResponse.json({
      success: true,
      expired: result.expired,
      offerIds: result.offerIds,
    });
  } catch (error: unknown) {
    console.error('[cron/dispatch-offer-expire]', error);
    const message = error instanceof Error ? error.message : 'Failed to expire offers';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
