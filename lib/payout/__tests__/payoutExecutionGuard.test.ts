import { describe, expect, it } from 'vitest';
import { evaluatePayoutExecutionHold, previewPayoutRecalc } from '../payoutExecutionGuard';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

describe('payoutExecutionGuard', () => {
  it('holds Elizabeth K READY $276.25 and previews $162.50', () => {
    const decision = evaluatePayoutExecutionHold({
      payoutId: ELIZABETH_K_PHASE2.payoutId,
      jobId: ELIZABETH_K_PHASE2.jobId,
      payoutStatus: 'READY',
      payoutGrossAmount: 425,
      payoutCleanerAmount: 276.25,
      invoiceStatus: 'DRAFT',
      invoiceTotal: 400,
      jobQuotedTotal: 425,
    });

    expect(decision.hold).toBe(true);
    expect(decision.mutatePayout).toBe(false);
    expect(decision.execute).toBe(false);
    expect(decision.code).toBe('PAYOUT_HOLD_QUOTE_BASIS');
    expect(decision.preview).toEqual(
      expect.objectContaining({
        authorizedGross: 250,
        cleanerAmount: 162.5,
        currentCleanerAmount: 276.25,
        currentGrossAmount: 425,
      })
    );
  });

  it('does not trap an unrelated READY payout with a DRAFT invoice', () => {
    const decision = evaluatePayoutExecutionHold({
      payoutId: 'other-payout',
      jobId: 'other-job',
      payoutStatus: 'READY',
      payoutGrossAmount: 265,
      payoutCleanerAmount: 172.25,
      invoiceStatus: 'DRAFT',
      invoiceTotal: 265,
      jobQuotedTotal: 265,
    });
    expect(decision.hold).toBe(false);
    expect(decision.code).toBeNull();
  });

  it('releases the Elizabeth hold after an authorized $250 recalc', () => {
    const decision = evaluatePayoutExecutionHold({
      payoutId: ELIZABETH_K_PHASE2.payoutId,
      jobId: ELIZABETH_K_PHASE2.jobId,
      payoutStatus: 'READY',
      payoutGrossAmount: 250,
      payoutCleanerAmount: 162.5,
      invoiceStatus: 'DRAFT',
      invoiceTotal: 250,
      jobQuotedTotal: 425,
    });
    expect(decision.hold).toBe(false);
  });

  it('does not execute, fail, or delete — preview only', () => {
    const preview = previewPayoutRecalc(250, 276.25, 425);
    expect(preview.cleanerAmount).toBe(162.5);
    expect(preview.currentCleanerAmount).toBe(276.25);
  });
});
