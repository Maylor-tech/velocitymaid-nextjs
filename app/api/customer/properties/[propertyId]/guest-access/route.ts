export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import {
  ensurePropertyGuestAccessToken,
  getPropertyGuestAccessState,
  revokePropertyGuestAccessToken,
  rotatePropertyGuestAccessToken,
} from '@/lib/stay/propertyGuestAccess';

type RouteContext = { params: { propertyId: string } };

async function requireOwnedProperty(propertyId: string, customerId: string) {
  return loadOwnedProperty(prisma, propertyId, customerId);
}

/**
 * GET /api/customer/properties/[propertyId]/guest-access
 * Host-only, strictly read-only. Never creates/rotates/reactivates tokens.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const property = await requireOwnedProperty(
      params.propertyId,
      session.customerId
    );
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const state = await getPropertyGuestAccessState(property.id);

    return NextResponse.json({
      success: true,
      stayUrl: state.stayUrl,
      guestDisplayName: state.guestDisplayName,
      active: state.active,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load guest access';
    console.error('[customer/properties/:id/guest-access GET]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/customer/properties/[propertyId]/guest-access
 * Body: { action: 'rotate' | 'revoke' | 'ensure', guestDisplayName?: string }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const property = await requireOwnedProperty(
      params.propertyId,
      session.customerId
    );
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : 'ensure';

    if (typeof body.guestDisplayName === 'string') {
      const name = body.guestDisplayName.trim().slice(0, 120);
      await prisma.property.update({
        where: { id: property.id },
        data: { guestDisplayName: name.length > 0 ? name : null },
      });
    }

    if (action === 'revoke') {
      await revokePropertyGuestAccessToken(property.id);
      return NextResponse.json({ success: true, active: false, stayUrl: null });
    }

    if (action === 'rotate') {
      const rotated = await rotatePropertyGuestAccessToken(property.id);
      return NextResponse.json({
        success: true,
        active: true,
        stayUrl: rotated.stayUrl,
      });
    }

    const ensured = await ensurePropertyGuestAccessToken(property.id);
    return NextResponse.json({
      success: true,
      active: true,
      stayUrl: ensured.stayUrl,
      created: ensured.created,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update guest access';
    console.error('[customer/properties/:id/guest-access POST]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
