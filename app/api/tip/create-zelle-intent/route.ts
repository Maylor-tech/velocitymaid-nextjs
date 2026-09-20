export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  createTipIntent,
  parseTipAmountToCents,
  TipBeneficiaryError,
} from '@/lib/tips/createTipIntent';
import { getVelocityMaidZelleDestination } from '@/lib/tips/zelleDestination';
import { requireCustomerTipJobAccess } from '@/lib/tips/requireCustomerTipJobAccess';

/**
 * POST /api/tip/create-zelle-intent
 * Authenticated host tip — CUSTOMER + job ownership required.
 * Manual reconciliation. Guest-by-raw-Job.id is unsupported.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      amount?: number;
      jobId?: string;
      guestName?: string;
      guestMessage?: string;
      market?: string;
      cleanerId?: unknown;
    };

    if (!body.jobId || typeof body.jobId !== 'string') {
      return NextResponse.json(
        { error: 'jobId is required.', code: 'JOB_REQUIRED' },
        { status: 400 }
      );
    }
    if (body.cleanerId != null) {
      return NextResponse.json(
        { error: 'Cleaner cannot be supplied by the client.', code: 'FORBIDDEN_FIELD' },
        { status: 400 }
      );
    }

    await requireCustomerTipJobAccess(request, body.jobId);

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
        jobId: body.jobId,
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
                e.code === 'NO_SERVICE_EARNER'
              ? 409
              : 400;
        return NextResponse.json(
          { error: e.message, code: e.code },
          { status }
        );
      }
      throw e;
    }

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
      // Explicit: guest cannot self-confirm
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
