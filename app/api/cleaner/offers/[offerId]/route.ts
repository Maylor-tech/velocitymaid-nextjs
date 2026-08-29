export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { serializeCleanerOffer } from '@/lib/dispatch/serializeCleanerOffer';

export async function GET(
  request: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const offer = await prisma.jobOffer.findUnique({
      where: { id: params.offerId },
      include: {
        Job: {
          select: {
            jobReference: true,
            serviceType: true,
            preferredDate: true,
            preferredTime: true,
            serviceLocation: true,
            Property: { select: { city: true, state: true } },
          },
        },
      },
    });
    if (!offer || offer.cleanerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      offer: serializeCleanerOffer(offer),
    });
  } catch (err) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    const message = err instanceof Error ? err.message : 'Failed to load offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
