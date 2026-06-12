import { PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { logAuditEntry } from '@/lib/audit';

export type DepositRefundResult =
  | { status: 'refunded'; refundId: string; amount: number }
  | { status: 'already_refunded'; refundId?: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

async function resolveDepositPaymentIntentId(job: {
  depositPaymentIntentId: string | null;
  sessionId: string | null;
}): Promise<string | null> {
  if (job.depositPaymentIntentId) {
    return job.depositPaymentIntentId;
  }

  if (!job.sessionId) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(job.sessionId);
  if (typeof session.payment_intent === 'string') {
    return session.payment_intent;
  }
  return session.payment_intent?.id ?? null;
}

async function findExistingDepositRefund(
  stripe: Stripe,
  paymentIntentId: string
): Promise<Stripe.Refund | null> {
  const refunds = await stripe.refunds.list({
    payment_intent: paymentIntentId,
    limit: 10,
  });
  return refunds.data.find((r) => r.status === 'succeeded') ?? null;
}

/**
 * Refund the booking deposit for a rejected job. Idempotent — skips if already refunded.
 */
export async function refundDepositForRejectedJob(
  jobId: string,
  actorId: string
): Promise<DepositRefundResult> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { status: 'failed', error: 'Job not found' };
  }

  if (job.paymentStatus === PaymentStatus.REFUNDED) {
    return { status: 'already_refunded' };
  }

  if (job.paymentStatus !== PaymentStatus.DEPOSIT_PAID) {
    return {
      status: 'skipped',
      reason: `Cannot refund deposit when paymentStatus=${job.paymentStatus}`,
    };
  }

  const paymentIntentId = await resolveDepositPaymentIntentId(job);
  if (!paymentIntentId) {
    return { status: 'skipped', reason: 'No Stripe deposit payment intent on file' };
  }

  const stripe = getStripe();

  try {
    const existingRefund = await findExistingDepositRefund(stripe, paymentIntentId);
    if (existingRefund) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          amountPaid: 0,
          balanceDue: job.quotedTotal ? Number(job.quotedTotal) : job.balanceDue,
        },
      });
      return {
        status: 'already_refunded',
        refundId: existingRefund.id,
      };
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          jobId,
          refundType: 'deposit_rejection',
        },
      },
      {
        idempotencyKey: `deposit-refund-${jobId}`,
      }
    );

    await prisma.job.update({
      where: { id: jobId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        amountPaid: 0,
        balanceDue: job.quotedTotal ? Number(job.quotedTotal) : job.balanceDue,
      },
    });

    await logAuditEntry({
      actorId,
      actorRole: 'ADMIN',
      action: 'DEPOSIT_REFUNDED',
      entityType: 'Job',
      entityId: jobId,
      description: `Deposit refunded via Stripe (${refund.id})`,
      changes: {
        refundId: refund.id,
        amount: (refund.amount ?? 0) / 100,
        paymentIntentId,
      },
    });

    return {
      status: 'refunded',
      refundId: refund.id,
      amount: (refund.amount ?? 0) / 100,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe refund failed';
    console.error('[DEPOSIT REFUND]', jobId, message);
    return { status: 'failed', error: message };
  }
}
