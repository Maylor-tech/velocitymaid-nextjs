import { calcPayout, round2 } from '@/lib/payoutRules';

export class CompensationRequiredError extends Error {
  readonly code = 'COMPENSATION_REQUIRED';
  constructor(message: string) {
    super(message);
    this.name = 'CompensationRequiredError';
  }
}

/**
 * Preview only — operationalTotal is the payout base, not a customer invoice.
 * Never fall back to quotedTotal / totalPrice (customer commercial amounts).
 */
export function previewCompensationFromOperationalTotal(
  operationalTotal: unknown
): number | null {
  const n = toPositiveMoney(operationalTotal);
  if (n == null) return null;
  return calcPayout(n).cleanerAmount;
}

/**
 * Ops must submit an explicit snapshot before Send Offer.
 * Rejects null, non-finite, and non-positive amounts.
 */
export function parseApprovedCompensation(raw: unknown): number {
  const n = toPositiveMoney(raw);
  if (n == null) {
    throw new CompensationRequiredError(
      'Cleaner compensation is required before sending an offer. Enter the approved cleaner pay amount. Do not derive it from an unknown or customer invoice total.'
    );
  }
  return n;
}

function toPositiveMoney(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return round2(n);
}

export function assertCompensationNotCustomerTotal(input: {
  compensationAmount: number;
  quotedTotal?: unknown;
  totalPrice?: unknown;
}): void {
  const quoted = toPositiveMoney(input.quotedTotal);
  const total = toPositiveMoney(input.totalPrice);
  if (quoted != null && input.compensationAmount === quoted) {
    throw new CompensationRequiredError(
      'Compensation matches the customer quoted total. Enter the cleaner share, not the customer invoice.'
    );
  }
  if (total != null && input.compensationAmount === total) {
    throw new CompensationRequiredError(
      'Compensation matches the customer total. Enter the cleaner share, not the customer invoice.'
    );
  }
}
