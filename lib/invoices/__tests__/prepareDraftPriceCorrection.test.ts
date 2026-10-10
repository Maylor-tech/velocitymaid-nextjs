import { describe, expect, it } from 'vitest';
import {
  assertPhase2aApplyAuthorized,
  buildElizabethKPhase2aPlan,
} from '../prepareDraftPriceCorrection';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

const snapshot = {
  invoiceId: ELIZABETH_K_PHASE2.invoiceId,
  invoiceNumber: ELIZABETH_K_PHASE2.invoiceNumber,
  invoiceStatus: 'DRAFT',
  invoicePropertyAddress: '60 Pleasant St. Ludlow, VT, 05149',
  invoiceTotal: 400,
  invoiceAmountPaid: 0,
  invoiceBalanceDue: 400,
  invoiceNotes: null,
  jobId: ELIZABETH_K_PHASE2.jobId,
  jobAddress: '60 Pleasant St.,, Ludlow, VT, 05149',
  jobQuotedTotal: 425,
  jobAmountPaid: 25,
  jobBalanceDue: 400,
  depositPaymentIntentId: ELIZABETH_K_PHASE2.paymentIntentId,
};

describe('prepareDraftPriceCorrection', () => {
  it('captures original addresses and preserves the $425 quote while proposing $250', () => {
    const plan = buildElizabethKPhase2aPlan(snapshot);
    expect(plan.dryRun).toBe(true);
    expect(plan.writes).toBe(false);
    expect(plan.addressAudit.invoicePropertyAddress).toBe('60 Pleasant St. Ludlow, VT, 05149');
    expect(plan.addressAudit.jobAddress).toBe('60 Pleasant St.,, Ludlow, VT, 05149');
    expect(plan.addressAudit.canonicalAddress).toBe('60 Pleasant St, Ludlow, VT 05149');
    expect(plan.preserve.quotedTotal).toBe(425);
    expect(plan.preserve.depositPaymentIntentId).toBe(ELIZABETH_K_PHASE2.paymentIntentId);
    expect(plan.proposed.total).toBe(250);
    expect(plan.proposed.balanceDue).toBe(250);
    expect(plan.proposed.invoiceStatus).toBe('DRAFT');
    expect(plan.proposed.quotedTotalUnchanged).toBe(425);
    expect(plan.proposed.items[0]).toEqual({
      description: 'Deep Clean — October 4, 2026',
      quantity: 1,
      unitPrice: 250,
    });
  });

  it('refuses apply without the operator token and env flag', () => {
    expect(() => assertPhase2aApplyAuthorized({ dryRun: true })).toThrow(/dryRun/);
    expect(() =>
      assertPhase2aApplyAuthorized({ dryRun: false, confirmToken: 'nope' })
    ).toThrow(/ALLOW_PROD_MUTATION/);
  });
});
