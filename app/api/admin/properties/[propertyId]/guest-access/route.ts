export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import {
  getPropertyGuestAccessState,
  PRINTED_CARD_WARNING,
  revokePropertyGuestAccessToken,
  rotatePropertyGuestAccessToken,
  normalizeGuestDisplayName,
} from '@/lib/stay/propertyGuestAccess';

type RouteContext = { params: { propertyId: string } };

/**
 * GET /api/admin/properties/[propertyId]/guest-access
 * Admin break-glass inspection — no raw token, no customer login required.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(request, 'ADMIN');

    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: {
        id: true,
        name: true,
        guestDisplayName: true,
        customerId: true,
        Customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            archivedAt: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const state = await getPropertyGuestAccessState(property.id);

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        guestDisplayName: property.guestDisplayName,
        customerId: property.customerId,
        customerEmail: property.Customer.email,
        customerName: [property.Customer.firstName, property.Customer.lastName]
          .filter(Boolean)
          .join(' '),
        customerArchivedAt: property.Customer.archivedAt?.toISOString() ?? null,
      },
      guestAccess: {
        active: state.active,
        qrReady: state.qrReady,
        stayUrl: state.stayUrl,
        guestDisplayName: state.guestDisplayName,
        tokenCreatedAt: state.tokenCreatedAt,
        revokedAt: state.revokedAt,
        printedCardWarning: state.printedCardWarning,
      },
      feedbackAfterRevokePolicy:
        'Property revoke blocks /stay and new tip grants. Previously issued GUEST feedback public tokens may still accept submit under existing feedback rules.',
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to load guest access';
    console.error('[admin/properties/:id/guest-access GET]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/properties/[propertyId]/guest-access
 * Body: { action: 'revoke' | 'rotate', confirm: true, guestDisplayName?: string }
 * Emergency kill-switch without customer session.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireRole(request, 'ADMIN');

    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const confirm = body.confirm === true;
    const guestDisplayName = normalizeGuestDisplayName(body.guestDisplayName);
    const actor = {
      actorId: auth.userId?.startsWith('legacy') ? null : auth.userId,
      actorRole: 'ADMIN' as const,
    };

    if (action === 'revoke') {
      await revokePropertyGuestAccessToken(property.id, actor, {
        confirmed: confirm,
      });
      const state = await getPropertyGuestAccessState(property.id);
      return NextResponse.json({
        success: true,
        action: 'revoke',
        active: state.active,
        stayUrl: null,
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
        action: 'rotate',
        active: true,
        stayUrl: rotated.stayUrl,
        qrReady: rotated.qrReady,
        printedCardWarning: PRINTED_CARD_WARNING,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'action must be revoke or rotate',
        printedCardWarning: PRINTED_CARD_WARNING,
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to update guest access';
    const status =
      message.includes('Pass confirm: true') ||
      message.includes('display name') ||
      message.includes('archived')
        ? 400
        : 500;
    console.error('[admin/properties/:id/guest-access POST]', error);
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
