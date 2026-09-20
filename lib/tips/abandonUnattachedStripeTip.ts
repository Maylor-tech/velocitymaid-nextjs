/**
 * Compensate when a Stripe tip PaymentIntent cannot be fully initialized.
 *
 * Invariant: never leave a live Stripe PaymentIntent paired with a FAILED /
 * unlinked VelocityMaid Tip.
 *
 * - No PI yet (create threw): mark PENDING tip FAILED.
 * - PI exists: cancel PI first; only on successful cancel mark tip FAILED.
 * - Cancel fails/uncertain: attach PI id to tip (keep PENDING) for ops reconcile;
 *   do not mark FAILED.
 */

import { prisma } from '@/lib/prisma';

export async function abandonUnattachedStripeTip(tipId: string): Promise<void> {
  await prisma.tip.updateMany({
    where: {
      id: tipId,
      status: 'PENDING',
      paymentMethod: 'STRIPE',
      stripePaymentIntentId: null,
    },
    data: { status: 'FAILED' },
  });
}

export type StripePiCancelFn = (paymentIntentId: string) => Promise<unknown>;

export type ReconcileStripeTipInitResult =
  | { outcome: 'ABANDONED' }
  | {
      outcome: 'NEEDS_RECONCILE';
      tipId: string;
      paymentIntentId: string;
    };

/**
 * After Stripe PI creation succeeded but tip init cannot complete.
 * Cancels the PI before failing the local tip row.
 */
export async function reconcileFailedStripeTipInit(input: {
  tipId: string;
  paymentIntentId: string;
  cancelPaymentIntent: StripePiCancelFn;
}): Promise<ReconcileStripeTipInitResult> {
  const { tipId, paymentIntentId, cancelPaymentIntent } = input;

  try {
    await cancelPaymentIntent(paymentIntentId);
  } catch (cancelError) {
    console.error('[tip/stripe-init] PaymentIntent cancel failed — tip kept PENDING for reconcile', {
      tipId,
      paymentIntentId,
      error:
        cancelError instanceof Error ? cancelError.message : String(cancelError),
    });

    // Preserve linkage for ops; do not mark FAILED while a live PI may exist.
    try {
      await prisma.tip.updateMany({
        where: {
          id: tipId,
          status: 'PENDING',
          paymentMethod: 'STRIPE',
          stripePaymentIntentId: null,
        },
        data: { stripePaymentIntentId: paymentIntentId },
      });
    } catch (linkError) {
      console.error('[tip/stripe-init] failed to attach PI id for reconcile', {
        tipId,
        paymentIntentId,
        error: linkError instanceof Error ? linkError.message : String(linkError),
      });
    }

    return { outcome: 'NEEDS_RECONCILE', tipId, paymentIntentId };
  }

  await abandonUnattachedStripeTip(tipId);
  return { outcome: 'ABANDONED' };
}
