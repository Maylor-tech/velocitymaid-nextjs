/**
 * Compensate when Stripe PaymentIntent creation fails after a Tip row was inserted.
 * Idempotent: only PENDING STRIPE tips with no attached PaymentIntent become FAILED.
 * Leaves no active orphan PENDING tip liability.
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
