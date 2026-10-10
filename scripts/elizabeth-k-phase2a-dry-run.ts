/**
 * Elizabeth K Phase 2a dry-run only.
 * Prints the draft correction plan. Never writes.
 *
 *   npx tsx scripts/elizabeth-k-phase2a-dry-run.ts
 */
import { ELIZABETH_K_PHASE2 } from '../lib/billing/elizabethKPhase2';
import { buildElizabethKPhase2aPlan } from '../lib/invoices/prepareDraftPriceCorrection';

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
  jobQuotedTotal: ELIZABETH_K_PHASE2.preservedQuotedTotal,
  jobAmountPaid: ELIZABETH_K_PHASE2.depositAmount,
  jobBalanceDue: 400,
  depositPaymentIntentId: ELIZABETH_K_PHASE2.paymentIntentId,
};

const plan = buildElizabethKPhase2aPlan(snapshot);

console.log(JSON.stringify({
  title: 'Elizabeth K Phase 2a draft correction — DRY RUN',
  productionWrites: false,
  applyAuthorized: false,
  note: 'Operator approval required before any production write. quotedTotal $425 and PI history are preserved.',
  plan,
}, null, 2));
