export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  findActivePropertyByGuestToken,
  guestFacingDisplayName,
} from '@/lib/stay/propertyGuestAccess';
import { isStayFallbackEligible } from '@/lib/stay/resolveStay';

type RouteContext = { params: { token: string } };

/**
 * GET /api/stay/[token]
 * Public: safe display name + fallbackEligible boolean only.
 * Never returns recentCheckoutDates, Job IDs, or addresses.
 * Invalid/revoked → same 404 body.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const property = await findActivePropertyByGuestToken(params.token);
    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stay link is invalid or expired',
          code: 'INVALID_TOKEN',
        },
        { status: 404 }
      );
    }

    const fallbackEligible = await isStayFallbackEligible(property.id);

    return NextResponse.json({
      success: true,
      displayName: guestFacingDisplayName(property.guestDisplayName),
      fallbackEligible,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load stay';
    console.error('[api/stay/:token GET]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
