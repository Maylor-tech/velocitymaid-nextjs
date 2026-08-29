export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobOfferStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { serializeCleanerOffer } from '@/lib/dispatch/serializeCleanerOffer';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const offers = await prisma.jobOffer.findMany({
      where: {
        cleanerId: auth.userId,
        status: JobOfferStatus.OFFERED,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
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

    return NextResponse.json({
      success: true,
      offers: offers.map(serializeCleanerOffer),
    });
  } catch (err) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    const message = err instanceof Error ? err.message : 'Failed to load offers';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
