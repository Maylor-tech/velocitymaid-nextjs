import { prisma } from '@/lib/prisma';
import { resolveTipServiceEarner, TipBeneficiaryError } from '@/lib/tips/beneficiary';
import { allocateTipInternalReference } from '@/lib/tips/references';
import type { TipPaymentMethod } from '@/lib/tips/statuses';

export { TipBeneficiaryError };

const MIN_CENTS = 100;
const MAX_CENTS = 20000;

export type CreateTipIntentInput = {
  jobId: string;
  amountCents: number;
  currency?: string;
  paymentMethod: TipPaymentMethod;
  guestName?: string | null;
  guestMessage?: string | null;
  market?: string | null;
};

export type CreateTipIntentResult = {
  tipId: string;
  amountCents: number;
  currency: string;
  paymentMethod: TipPaymentMethod;
  status: 'PENDING';
  internalReference: string;
  beneficiaryCleanerId: string;
  jobId: string;
  propertyId: string | null;
};

export function parseTipAmountToCents(amountDollars: unknown): number {
  if (typeof amountDollars !== 'number' || !Number.isFinite(amountDollars)) {
    throw new TipBeneficiaryError('INVALID_AMOUNT', 'Amount must be a number.');
  }
  const cents = Math.round(amountDollars * 100);
  if (cents < MIN_CENTS || cents > MAX_CENTS) {
    throw new TipBeneficiaryError(
      'INVALID_AMOUNT',
      'Amount must be between $1 and $200.'
    );
  }
  return cents;
}

/**
 * Create a PENDING tip intent with frozen beneficiary.
 * Does not create Stripe PI or mark received.
 */
export async function createTipIntent(
  input: CreateTipIntentInput
): Promise<CreateTipIntentResult> {
  if (
    input.paymentMethod !== 'STRIPE' &&
    input.paymentMethod !== 'ZELLE' &&
    input.paymentMethod !== 'MANUAL'
  ) {
    throw new TipBeneficiaryError('INVALID_METHOD', 'Invalid payment method.');
  }

  if (input.amountCents < MIN_CENTS || input.amountCents > MAX_CENTS) {
    throw new TipBeneficiaryError(
      'INVALID_AMOUNT',
      'Amount must be between $1 and $200.'
    );
  }

  const earner = await resolveTipServiceEarner(input.jobId);
  const internalReference = await allocateTipInternalReference();
  const currency = (input.currency || 'usd').toLowerCase();

  const tip = await prisma.tip.create({
    data: {
      amount: input.amountCents,
      currency,
      guestName: input.guestName?.trim() || null,
      guestMessage: input.guestMessage?.trim() || null,
      market: input.market?.trim() || earner.marketLabel || null,
      status: 'PENDING',
      paymentMethod: input.paymentMethod,
      jobId: earner.jobId,
      propertyId: earner.propertyId,
      beneficiaryCleanerId: earner.beneficiaryCleanerId,
      internalReference,
      // Never store property access or full address on public tip flow
      propertyAddress: null,
      cleanerName: null,
    },
  });

  return {
    tipId: tip.id,
    amountCents: tip.amount,
    currency: tip.currency,
    paymentMethod: input.paymentMethod,
    status: 'PENDING',
    internalReference,
    beneficiaryCleanerId: earner.beneficiaryCleanerId,
    jobId: earner.jobId,
    propertyId: earner.propertyId,
  };
}
