export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import {
  createTipIntent,
  parseTipAmountToCents,
  TipBeneficiaryError,
} from '@/lib/tips/createTipIntent';
import { requireCustomerTipJobAccess } from '@/lib/tips/requireCustomerTipJobAccess';

/**
 * POST /api/tip/create-payment-intent
 * Authenticated host tip — CUSTOMER + job ownership required.
 * Freezes beneficiary server-side. Guest-by-raw-Job.id is unsupported.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      amount?: number;
      jobId?: string;
      guestName?: string;
      guestMessage?: string;
      market?: string;
      /** Rejected — beneficiary is server-derived only */
      cleanerId?: unknown;
      cleanerName?: unknown;
      propertyAddress?: unknown;
    };

    if (!body.jobId || typeof body.jobId !== 'string') {
      return NextResponse.json(
        { error: 'jobId is required.', code: 'JOB_REQUIRED' },
        { status: 400 }
      );
    }

    // Reject client-supplied cleaner / address tampering
    if (body.cleanerId != null || body.cleanerName != null) {
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
        paymentMethod: 'STRIPE',
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

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: intent.amountCents,
      currency: intent.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'cleaner_tip',
        tipId: intent.tipId,
        jobId: intent.jobId,
        beneficiaryCleanerId: intent.beneficiaryCleanerId,
      },
      description: `VelocityMaid tip ${intent.internalReference}`,
    });

    await prisma.tip.update({
      where: { id: intent.tipId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: 'Failed to initialize payment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      tipId: intent.tipId,
      internalReference: intent.internalReference,
      amountCents: intent.amountCents,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[tip/create-payment-intent]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create payment intent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
