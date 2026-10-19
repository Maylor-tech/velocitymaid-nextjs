import { PAYOUT_RULES } from '@/lib/payoutRules';

/** Matches PAYOUT_RULES.cleanerPct used by calcPayout. */
export const RECRUITMENT_CLEANER_PCT = Math.round(PAYOUT_RULES.cleanerPct * 100);

/**
 * Gross for 65% is the eligible job amount: operationalTotal when set,
 * otherwise quotedTotal, otherwise totalPrice. Dispatch offers show the
 * resulting payout before accept.
 */
export const RECRUITMENT_PAY_HEADING = `${RECRUITMENT_CLEANER_PCT}% of the eligible job amount`;

export const RECRUITMENT_PAY_OFFER_COPY =
  'Offered jobs show the property area, window, and your payout before you accept.';

export const RECRUITMENT_PAY_SCHEDULE_COPY =
  'After the job is marked complete, payout is queued. We pay on Fridays. You will see ready vs paid in the cleaner app.';
