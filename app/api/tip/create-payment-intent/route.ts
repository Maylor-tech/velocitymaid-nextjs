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
import {
  authorizeTipJobAccess,
  touchGrantAfterTipCreate,
} from '@/lib/tips/authorizeTipJobAccess';
import { checkTipCreateRateLimit } from '@/lib/tips/tipCreateRateLimit';
import { abandonUnattachedStripeTip } from '@/lib/tips/abandonUnattachedStripeTip';

/**
 * POST /api/tip/create-payment-intent
 * Trusted path: CUSTOMER + owned jobId, OR valid guest grantToken.
 * Freezes beneficiary server-side. Never accepts client cleanerId.
 *
 * Order: Tip row → Stripe PI → attach PI id → touch grant.
 * Stripe failure abandons the PENDING tip (FAILED); grant use is not recorded.
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
      cleanerName?: unknown;
      propertyAddress?: unknown;
    };

    if (body.cleanerId != null || body.cleanerName != null) {
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

    try {
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
          authMode: auth.mode,
        },
        description: `VelocityMaid tip ${intent.internalReference}`,
      });

      if (!paymentIntent.client_secret) {
        await abandonUnattachedStripeTip(intent.tipId);
        return NextResponse.json(
          { error: 'Failed to initialize payment.', code: 'STRIPE_INIT_FAILED' },
          { status: 500 }
        );
      }

      await prisma.tip.update({
        where: { id: intent.tipId },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      // Only after PI is created and attached — never on Stripe failure.
      await touchGrantAfterTipCreate(auth);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        tipId: intent.tipId,
        internalReference: intent.internalReference,
        amountCents: intent.amountCents,
      });
    } catch (stripeError) {
      try {
        await abandonUnattachedStripeTip(intent.tipId);
      } catch (abandonError) {
        console.error(
          '[tip/create-payment-intent] abandon after Stripe failure',
          abandonError
        );
      }
      if (stripeError instanceof Response) return stripeError;
      console.error('[tip/create-payment-intent] Stripe', stripeError);
      const message =
        stripeError instanceof Error
          ? stripeError.message
          : 'Failed to create payment intent';
      return NextResponse.json(
        { error: message, code: 'STRIPE_CREATE_FAILED' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[tip/create-payment-intent]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create payment intent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
