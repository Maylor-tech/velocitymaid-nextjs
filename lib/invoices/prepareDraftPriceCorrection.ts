import { computeBalanceDue, decimalToNumber, roundMoney } from './invoiceUtils';
import {
  ELIZABETH_K_PHASE2,
  PHASE2A_APPLY_TOKEN,
  PHASE2A_MUTATION_ENV,
} from '@/lib/billing/elizabethKPhase2';

export type DraftPriceCorrectionSnapshot = {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  invoicePropertyAddress: string;
  invoiceTotal: number;
  invoiceAmountPaid: number;
  invoiceBalanceDue: number;
  invoiceNotes: string | null;
  jobId: string;
  jobAddress: string | null;
  jobQuotedTotal: number | null;
  jobAmountPaid: number | null;
  jobBalanceDue: number | null;
  depositPaymentIntentId: string | null;
};

export type DraftPriceCorrectionPlan = {
  dryRun: true;
  writes: false;
  jobId: string;
  invoiceId: string;
  invoiceNumber: string;
  preserve: {
    quotedTotal: number | null;
    jobAmountPaid: number | null;
    depositPaymentIntentId: string | null;
  };
  addressAudit: {
    invoicePropertyAddress: string;
    jobAddress: string | null;
    canonicalAddress: string;
  };
  current: {
    invoiceStatus: string;
    invoiceTotal: number;
    invoiceAmountPaid: number;
    invoiceBalanceDue: number;
  };
  proposed: {
    invoiceStatus: 'DRAFT';
    propertyAddress: string;
    serviceType: string;
    jobDate: string;
    tax: 0;
    discount: 0;
    items: Array<{ description: string; quantity: 1; unitPrice: number }>;
    subtotal: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    jobAddress: string;
    quotedTotalUnchanged: number | null;
  };
  auditAction: 'INVOICE_DRAFT_PRICE_CORRECTION_PREPARED';
};

export function prepareDraftPriceCorrection(
  snapshot: DraftPriceCorrectionSnapshot,
  options?: { authorizedTotal?: number; canonicalAddress?: string }
): DraftPriceCorrectionPlan {
  if (snapshot.invoiceStatus !== 'DRAFT') {
    throw new Error('Phase 2a price correction is only valid on a DRAFT invoice');
  }

  const authorizedTotal = roundMoney(
    options?.authorizedTotal ?? ELIZABETH_K_PHASE2.authorizedInvoiceTotal
  );
  const canonicalAddress = options?.canonicalAddress ?? ELIZABETH_K_PHASE2.canonicalAddress;
  const amountPaid = decimalToNumber(snapshot.invoiceAmountPaid);

  return {
    dryRun: true,
    writes: false,
    jobId: snapshot.jobId,
    invoiceId: snapshot.invoiceId,
    invoiceNumber: snapshot.invoiceNumber,
    preserve: {
      quotedTotal: snapshot.jobQuotedTotal,
      jobAmountPaid: snapshot.jobAmountPaid,
      depositPaymentIntentId: snapshot.depositPaymentIntentId,
    },
    addressAudit: {
      invoicePropertyAddress: snapshot.invoicePropertyAddress,
      jobAddress: snapshot.jobAddress,
      canonicalAddress,
    },
    current: {
      invoiceStatus: snapshot.invoiceStatus,
      invoiceTotal: decimalToNumber(snapshot.invoiceTotal),
      invoiceAmountPaid: amountPaid,
      invoiceBalanceDue: decimalToNumber(snapshot.invoiceBalanceDue),
    },
    proposed: {
      invoiceStatus: 'DRAFT',
      propertyAddress: canonicalAddress,
      serviceType: ELIZABETH_K_PHASE2.serviceType,
      jobDate: ELIZABETH_K_PHASE2.jobDate,
      tax: 0,
      discount: 0,
      items: [
        {
          description: ELIZABETH_K_PHASE2.lineDescription,
          quantity: 1,
          unitPrice: authorizedTotal,
        },
      ],
      subtotal: authorizedTotal,
      total: authorizedTotal,
      amountPaid,
      balanceDue: computeBalanceDue(authorizedTotal, amountPaid),
      jobAddress: canonicalAddress,
      quotedTotalUnchanged: snapshot.jobQuotedTotal,
    },
    auditAction: 'INVOICE_DRAFT_PRICE_CORRECTION_PREPARED',
  };
}

export function buildElizabethKPhase2aPlan(
  snapshot: DraftPriceCorrectionSnapshot
): DraftPriceCorrectionPlan {
  if (snapshot.jobId !== ELIZABETH_K_PHASE2.jobId) {
    throw new Error('Snapshot jobId is not the Elizabeth K Phase 2 job');
  }
  if (snapshot.invoiceId !== ELIZABETH_K_PHASE2.invoiceId) {
    throw new Error('Snapshot invoiceId is not VM-2026-0053');
  }
  if (
    snapshot.jobQuotedTotal != null &&
    decimalToNumber(snapshot.jobQuotedTotal) !== ELIZABETH_K_PHASE2.preservedQuotedTotal
  ) {
    throw new Error('Refusing to prepare a plan that would imply a quotedTotal change');
  }
  return prepareDraftPriceCorrection(snapshot);
}

/**
 * Apply is intentionally inert unless both the env flag and confirm token are set.
 * Phase 2 must not write production from this branch without explicit operator approval.
 */
export function assertPhase2aApplyAuthorized(params: {
  dryRun?: boolean;
  confirmToken?: string;
}): void {
  if (params.dryRun !== false) {
    throw new Error('Phase 2a apply refused: dryRun is required unless explicitly disabled');
  }
  if (process.env.ALLOW_PROD_MUTATION !== PHASE2A_MUTATION_ENV) {
    throw new Error('Phase 2a apply refused: ALLOW_PROD_MUTATION is not set');
  }
  if (params.confirmToken !== PHASE2A_APPLY_TOKEN) {
    throw new Error('Phase 2a apply refused: confirm token mismatch');
  }
}
