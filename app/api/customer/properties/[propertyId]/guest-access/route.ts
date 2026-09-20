export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import {
  ensurePropertyGuestAccessToken,
  getPropertyGuestAccessState,
  normalizeGuestDisplayName,
  PRINTED_CARD_WARNING,
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
 * Never returns the raw guest-access token.
 *
 * Feedback-after-revoke (Phase 1D-A): property revoke blocks /stay and new
 * resolve/grant mint. Already-issued GUEST ServiceFeedback.publicToken may
 * continue under existing feedback rules and is not tied to property-token state.
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
      qrReady: state.qrReady,
      tokenCreatedAt: state.tokenCreatedAt,
      revokedAt: state.revokedAt,
      printedCardWarning: state.printedCardWarning,
      feedbackAfterRevokePolicy:
        'Property revoke blocks /stay and new tip grants. Previously issued GUEST feedback public tokens may still accept submit under existing feedback rules.',
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
 * Body: {
 *   action: 'rotate' | 'revoke' | 'ensure',
 *   guestDisplayName?: string,
 *   confirm?: boolean  // required for rotate/revoke
 * }
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
    const confirm = body.confirm === true;
    const guestDisplayName = normalizeGuestDisplayName(body.guestDisplayName);
    const actor = {
      actorId: session.customerId,
      actorRole: 'CUSTOMER' as const,
    };

    if (action === 'revoke') {
      await revokePropertyGuestAccessToken(property.id, actor, { confirmed: confirm });
      return NextResponse.json({
        success: true,
        active: false,
        stayUrl: null,
        qrReady: false,
        printedCardWarning: PRINTED_CARD_WARNING,
      });
    }

    if (action === 'rotate') {
      const rotated = await rotatePropertyGuestAccessToken(property.id, actor, {
        confirmed: confirm,
        guestDisplayName,
      });
      return NextResponse.json({
        success: true,
        active: true,
        stayUrl: rotated.stayUrl,
        qrReady: rotated.qrReady,
        printedCardWarning: PRINTED_CARD_WARNING,
      });
    }

    const ensured = await ensurePropertyGuestAccessToken(property.id, actor, {
      guestDisplayName,
    });
    return NextResponse.json({
      success: true,
      active: true,
      stayUrl: ensured.stayUrl,
      created: ensured.created,
      qrReady: ensured.qrReady,
      printedCardWarning: PRINTED_CARD_WARNING,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update guest access';
    const status =
      message.includes('Pass confirm: true') ||
      message.includes('display name') ||
      message.includes('archived')
        ? 400
        : 500;
    console.error('[customer/properties/:id/guest-access POST]', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        printedCardWarning: PRINTED_CARD_WARNING,
      },
      { status }
    );
  }
}
