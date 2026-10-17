/**
 * DEFECT: invoice PAID while Job.paymentStatus stays PENDING.
 *
 * This plans a future repair. It does not write. Job price fields are
 * preserved: the $300 job price vs $500.63 invoice total is a separate
 * identity issue and must not be "fixed" by copying one onto the other.
 */

export type InvoiceJobPaymentSnapshot = {
  invoiceStatus: string;
  invoiceAmountPaid: number;
  invoiceBalanceDue: number;
  jobPaymentStatus: string;
  jobTotalPrice: number;
};

export type InvoiceJobPaymentRepairPlan =
  | { kind: 'in_sync' }
  | { kind: 'out_of_scope'; reason: string }
  | {
      kind: 'repair';
      paymentStatus: 'PAID';
      amountPaid: number;
      balanceDue: 0;
      /** Echo of the current job price. Not a write. */
      preserveJobTotalPrice: number;
      /** Fields a later approved backfill may update. Price fields are absent. */
      writes: readonly ['paymentStatus', 'amountPaid', 'balanceDue'];
    };

const PRICE_FIELDS = ['totalPrice', 'quotedTotal', 'price'] as const;

export function planInvoicePaidJobPendingRepair(
  row: InvoiceJobPaymentSnapshot
): InvoiceJobPaymentRepairPlan {
  if (row.jobPaymentStatus === 'REFUNDED') {
    return { kind: 'out_of_scope', reason: 'Refunded job payment is left unchanged.' };
  }
  if (row.invoiceStatus !== 'PAID' || row.invoiceBalanceDue > 0) {
    return { kind: 'out_of_scope', reason: 'Invoice is not fully paid.' };
  }
  if (row.jobPaymentStatus === 'PAID') {
    return { kind: 'in_sync' };
  }
  if (row.jobPaymentStatus !== 'PENDING' && row.jobPaymentStatus !== 'BALANCE_DUE') {
    return {
      kind: 'out_of_scope',
      reason: `Job payment status ${row.jobPaymentStatus} needs a separate review.`,
    };
  }

  const plan = {
    kind: 'repair' as const,
    paymentStatus: 'PAID' as const,
    amountPaid: row.invoiceAmountPaid,
    balanceDue: 0 as const,
    preserveJobTotalPrice: row.jobTotalPrice,
    writes: ['paymentStatus', 'amountPaid', 'balanceDue'] as const,
  };

  for (const field of PRICE_FIELDS) {
    if (field in plan) {
      throw new Error(`Repair plan must not write ${field}`);
    }
  }

  return plan;
}
