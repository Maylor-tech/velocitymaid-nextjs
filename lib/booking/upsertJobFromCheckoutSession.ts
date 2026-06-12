import { randomUUID } from 'crypto';
import type Stripe from 'stripe';
import type { Job, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeJobPaymentFromSession } from '@/lib/booking/jobPayment';

export type UpsertJobFromCheckoutResult = {
  job: Job;
  created: boolean;
};

export function isPrismaUniqueConstraintError(
  error: unknown,
  field?: string
): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  ) {
    if (!field) return true;
    const target = (error as { meta?: { target?: string[] } }).meta?.target;
    return Array.isArray(target) && target.includes(field);
  }
  return false;
}

function buildJobCreateData(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>,
  customerId: string | null
): Prisma.JobCreateInput {
  const branchId = metadata.branchId;
  if (!branchId) {
    throw new Error('Branch ID not found in payment session metadata');
  }

  const firstName = metadata.firstName || '';
  const lastInitial = metadata.lastInitial || '';
  const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();
  const paymentFields = computeJobPaymentFromSession(session, metadata);
  const preferredDate = metadata.preferredDate
    ? new Date(metadata.preferredDate)
    : null;
  const promoDiscount = metadata.referralDiscount
    ? parseFloat(metadata.referralDiscount)
    : null;

  return {
    id: randomUUID(),
    sessionId: session.id,
    Branch: { connect: { id: branchId } },
    ...(customerId ? { Customer: { connect: { id: customerId } } } : {}),
    customerName: customerName || null,
    preferredDate,
    preferredTime: metadata.preferredTime || null,
    serviceType: metadata.serviceType || null,
    serviceLocation: metadata.serviceLocation || null,
    address: metadata.address || null,
    status: 'RECEIVED',
    totalPrice: paymentFields.totalPrice,
    quotedTotal: paymentFields.quotedTotal,
    depositAmount: paymentFields.depositAmount,
    amountPaid: paymentFields.amountPaid,
    balanceDue: paymentFields.balanceDue,
    paymentStatus: paymentFields.paymentStatus,
    reviewStatus: paymentFields.reviewStatus,
    depositPaymentIntentId: paymentFields.depositPaymentIntentId,
    depositPaidAt: paymentFields.depositPaidAt,
    currency: metadata.currency || 'USD',
    paymentMethod: 'card',
    appliedReferralCode: metadata.referralCode || null,
    promoApplied: metadata.promoCode || null,
    promoDiscount: promoDiscount ?? null,
  };
}

/**
 * Idempotent job creation keyed by Stripe Checkout session ID.
 * Safe when webhook and /api/booking/create run concurrently or in any order.
 */
export async function upsertJobFromCheckoutSession(options: {
  session: Stripe.Checkout.Session;
  metadata: Record<string, string>;
  customerId?: string | null;
}): Promise<UpsertJobFromCheckoutResult> {
  const { session, metadata, customerId = null } = options;
  const sessionId = session.id;

  const existing = await prisma.job.findUnique({
    where: { sessionId },
  });

  if (existing) {
    if (customerId && !existing.customerId) {
      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: { customerId },
      });
      return { job: updated, created: false };
    }
    return { job: existing, created: false };
  }

  const createData = buildJobCreateData(session, metadata, customerId);

  try {
    const job = await prisma.job.create({ data: createData });
    return { job, created: true };
  } catch (error) {
    if (isPrismaUniqueConstraintError(error, 'sessionId')) {
      const job = await prisma.job.findUnique({
        where: { sessionId },
      });
      if (!job) throw error;
      if (customerId && !job.customerId) {
        const updated = await prisma.job.update({
          where: { id: job.id },
          data: { customerId },
        });
        return { job: updated, created: false };
      }
      return { job, created: false };
    }
    throw error;
  }
}
