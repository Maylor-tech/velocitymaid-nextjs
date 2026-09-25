export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  createTipIntent,
  parseTipAmountToCents,
  TipBeneficiaryError,
} from '@/lib/tips/createTipIntent';
import { getVelocityMaidZelleDestination } from '@/lib/tips/zelleDestination';
import {
  authorizeTipJobAccess,
  touchGrantAfterTipCreate,
} from '@/lib/tips/authorizeTipJobAccess';
import { checkTipCreateRateLimit } from '@/lib/tips/tipCreateRateLimit';

/**
 * POST /api/tip/create-zelle-intent
 * Trusted path: CUSTOMER + owned jobId, OR valid guest grantToken.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      amount?: number;
      jobId?: string;
      grantToken?: string;
      guestName?: string;
      guestMessage?: string;
      market?: string;
      cleanerId?: unknown;
    };

    if (body.cleanerId != null) {
      return NextResponse.json(
        { error: 'Cleaner cannot be supplied by the client.', code: 'FORBIDDEN_FIELD' },
        { status: 400 }
      );
    }

    const auth = await authorizeTipJobAccess(request, {
      jobId: body.jobId,
      grantToken: body.grantToken,
    });

    if (auth.mode === 'GUEST_GRANT') {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const rateKey = `${ip}:${auth.grantId.slice(0, 12)}`;
      if (!(await checkTipCreateRateLimit(rateKey))) {
        return NextResponse.json(
          {
            error: 'Too many tip attempts. Please try again later.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        );
      }
    }

    let amountCents: number;
    try {
      amountCents = parseTipAmountToCents(body.amount);
    } catch (e) {
      if (e instanceof TipBeneficiaryError) {
        return NextResponse.json(
          { error: e.message, code: e.code },
          { status: 400 }
        );
      }
      throw e;
    }

    let intent;
    try {
      intent = await createTipIntent({
        jobId: auth.jobId,
        amountCents,
        paymentMethod: 'ZELLE',
        guestName: body.guestName,
        guestMessage: body.guestMessage,
        market: body.market,
      });
    } catch (e) {
      if (e instanceof TipBeneficiaryError) {
        const status =
          e.code === 'JOB_NOT_FOUND'
            ? 404
            : e.code === 'JOB_NOT_ELIGIBLE' ||
                e.code === 'JOB_NOT_COMPLETED' ||
                e.code === 'NO_SERVICE_EARNER' ||
                e.code === 'AMBIGUOUS_SERVICE_EARNERS'
              ? 409
              : 400;
        return NextResponse.json(
          { error: e.message, code: e.code },
          { status }
        );
      }
      throw e;
    }

    await touchGrantAfterTipCreate(auth);

    const zelle = getVelocityMaidZelleDestination();

    return NextResponse.json({
      tipId: intent.tipId,
      status: intent.status,
      amountCents: intent.amountCents,
      currency: intent.currency,
      internalReference: intent.internalReference,
      paymentMethod: 'ZELLE',
      zelle: {
        label: zelle.label,
        handle: zelle.handle,
        instructions: zelle.instructions,
      },
      guestCanConfirm: false,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[tip/create-zelle-intent]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create Zelle tip intent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
