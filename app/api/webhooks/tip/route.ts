export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { markTipReceived } from '@/lib/tips/markTipReceived';
import {
  applyTipDisputeClosed,
  applyTipDisputeOpened,
  applyTipFullRefund,
  applyTipPaymentFailed,
  findTipByPaymentIntentId,
} from '@/lib/tips/tipReversal';

function paymentIntentIdFromCharge(
  charge: Stripe.Charge
): string | null {
  const pi = charge.payment_intent;
  if (!pi) return null;
  return typeof pi === 'string' ? pi : pi.id;
}

async function findTipForCharge(charge: Stripe.Charge) {
  const piId = paymentIntentIdFromCharge(charge);
  if (piId) {
    const byPi = await findTipByPaymentIntentId(piId);
    if (byPi) return byPi;
  }
  const tipId = charge.metadata?.tipId;
  if (tipId) {
    return prisma.tip.findUnique({
      where: { id: tipId },
      select: { id: true },
    });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_TIP_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook signature or secret missing' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid webhook signature';
      console.error('[webhooks/tip] Signature verification failed:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const tip =
        (await findTipByPaymentIntentId(paymentIntent.id)) ||
        (paymentIntent.metadata?.tipId
          ? await prisma.tip.findUnique({
              where: { id: paymentIntent.metadata.tipId },
              select: { id: true },
            })
          : null);

      if (!tip) {
        console.warn(
          '[webhooks/tip] No tip for PI',
          paymentIntent.id,
          paymentIntent.metadata?.tipId
        );
        return NextResponse.json({ received: true, matched: false });
      }

      const result = await markTipReceived({
        tipId: tip.id,
        amountCents: paymentIntent.amount,
        stripeEventId: event.id,
        providerReference: paymentIntent.id,
        source: 'STRIPE_WEBHOOK',
      });

      return NextResponse.json({ received: true, tip: result });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const tip = await findTipByPaymentIntentId(paymentIntent.id);
      if (tip) {
        await applyTipPaymentFailed({
          tipId: tip.id,
          stripeEventId: event.id,
          eventType: event.type,
        });
      } else {
        await prisma.tip.updateMany({
          where: {
            stripePaymentIntentId: paymentIntent.id,
            status: { in: ['PENDING', 'pending'] },
          },
          data: { status: 'FAILED' },
        });
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      // Full refund only for this phase (amount_refunded >= amount)
      if (charge.amount_refunded < charge.amount) {
        console.warn('[webhooks/tip] Partial refund ignored', {
          chargeId: charge.id,
          amount: charge.amount,
          amount_refunded: charge.amount_refunded,
        });
        return NextResponse.json({
          received: true,
          ignored: 'partial_refund',
        });
      }
      const tip = await findTipForCharge(charge);
      if (!tip) {
        return NextResponse.json({ received: true, matched: false });
      }
      const result = await applyTipFullRefund({
        tipId: tip.id,
        stripeEventId: event.id,
        eventType: event.type,
      });
      return NextResponse.json({ received: true, tip: result });
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      let tip: { id: string } | null = null;
      if (chargeId) {
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          tip = await findTipForCharge(charge);
        } catch (err) {
          console.error('[webhooks/tip] charge retrieve for dispute', err);
        }
      }
      if (!tip && dispute.payment_intent) {
        const piId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent.id;
        tip = await findTipByPaymentIntentId(piId);
      }
      if (!tip) {
        return NextResponse.json({ received: true, matched: false });
      }
      const result = await applyTipDisputeOpened({
        tipId: tip.id,
        stripeEventId: event.id,
        eventType: event.type,
      });
      return NextResponse.json({ received: true, tip: result });
    }

    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      let tip: { id: string } | null = null;
      if (chargeId) {
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          tip = await findTipForCharge(charge);
        } catch (err) {
          console.error('[webhooks/tip] charge retrieve for dispute close', err);
        }
      }
      if (!tip && dispute.payment_intent) {
        const piId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent.id;
        tip = await findTipByPaymentIntentId(piId);
      }
      if (!tip) {
        return NextResponse.json({ received: true, matched: false });
      }
      const result = await applyTipDisputeClosed({
        tipId: tip.id,
        stripeEventId: event.id,
        eventType: event.type,
        stripeDisputeStatus: dispute.status,
      });
      return NextResponse.json({ received: true, tip: result });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhooks/tip]', error);
    const message =
      error instanceof Error ? error.message : 'Webhook handler failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
