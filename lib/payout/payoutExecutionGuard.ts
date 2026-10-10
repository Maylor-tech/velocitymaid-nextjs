import { calcPayout, round2 } from '@/lib/payoutRules';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

export type PayoutHoldInput = {
  payoutId?: string | null;
  jobId?: string | null;
  payoutStatus: string;
  payoutGrossAmount: number;
  payoutCleanerAmount: number;
  invoiceStatus: string | null;
  invoiceTotal: number | null;
  jobQuotedTotal: number | null;
  authorizedInvoiceTotal?: number | null;
};

export type PayoutRecalcPreview = {
  authorizedGross: number;
  cleanerAmount: number;
  platformFee: number;
  rulesVersion: string;
  currentCleanerAmount: number;
  currentGrossAmount: number;
};

export type PayoutHoldDecision = {
  hold: boolean;
  mutatePayout: false;
  execute: false;
  code: string | null;
  reason: string | null;
  preview: PayoutRecalcPreview | null;
};

function money(n: number): number {
  return round2(n);
}

function isElizabethPayout(input: PayoutHoldInput): boolean {
  return (
    input.jobId === ELIZABETH_K_PHASE2.jobId ||
    input.payoutId === ELIZABETH_K_PHASE2.payoutId
  );
}

function previewFromGross(
  authorizedGross: number,
  current: { payoutGrossAmount: number; payoutCleanerAmount: number }
): PayoutRecalcPreview {
  const calculated = calcPayout(authorizedGross);
  return {
    authorizedGross: calculated.grossAmount,
    cleanerAmount: calculated.cleanerAmount,
    platformFee: calculated.platformFee,
    rulesVersion: calculated.rulesVersion,
    currentCleanerAmount: money(current.payoutCleanerAmount),
    currentGrossAmount: money(current.payoutGrossAmount),
  };
}

/**
 * Hold only the Elizabeth K quote-basis READY $276.25 until gross matches $250.
 * Aligned payouts (including other jobs with DRAFT invoices) are not trapped.
 */
export function evaluatePayoutExecutionHold(input: PayoutHoldInput): PayoutHoldDecision {
  const status = input.payoutStatus.toUpperCase();
  if (status === 'SENT' || status === 'PAID') {
    return {
      hold: false,
      mutatePayout: false,
      execute: false,
      code: null,
      reason: null,
      preview: null,
    };
  }

  if (!isElizabethPayout(input)) {
    return {
      hold: false,
      mutatePayout: false,
      execute: false,
      code: null,
      reason: null,
      preview: null,
    };
  }

  const authorized = money(
    input.authorizedInvoiceTotal ?? ELIZABETH_K_PHASE2.authorizedInvoiceTotal
  );
  const gross = money(input.payoutGrossAmount);
  const cleaner = money(input.payoutCleanerAmount);
  const preview = previewFromGross(authorized, input);

  const stillOnQuote =
    moneyEq(gross, ELIZABETH_K_PHASE2.preservedQuotedTotal) ||
    moneyEq(cleaner, 276.25);

  if (stillOnQuote || gross !== authorized) {
    return {
      hold: true,
      mutatePayout: false,
      execute: false,
      code: 'PAYOUT_HOLD_QUOTE_BASIS',
      reason:
        'Elizabeth K payout is still on the preserved $425 quote ($276.25). Hold execution until an authorized recalc from $250 ($162.50). The READY row is not mutated.',
      preview,
    };
  }

  return {
    hold: false,
    mutatePayout: false,
    execute: false,
    code: null,
    reason: null,
    preview,
  };
}

function moneyEq(a: number, b: number): boolean {
  return money(a) === money(b);
}

export function previewPayoutRecalc(authorizedGross: number, currentCleanerAmount = 0, currentGrossAmount = 0) {
  return previewFromGross(authorizedGross, {
    payoutCleanerAmount: currentCleanerAmount,
    payoutGrossAmount: currentGrossAmount,
  });
}
