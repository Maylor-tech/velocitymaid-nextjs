export type PayBalanceJobSnapshot = {
  status: string;
  paymentStatus?: string | null;
  balanceDue?: number | null;
  reviewStatus?: string | null;
  billingPolicy?: string | null;
};

/** Whether the customer job detail page should show the Pay Remaining Balance CTA. */
export function canShowPayBalance(job: PayBalanceJobSnapshot): boolean {
  const normalizedStatus = job.status.toUpperCase();

  if (normalizedStatus !== 'COMPLETED') return false;
  if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'CANCELLED_EMERGENCY') {
    return false;
  }
  if (job.reviewStatus === 'REJECTED') return false;
  if (job.billingPolicy === 'INVOICE_AFTER_SERVICE') return false;
  if (job.paymentStatus === 'PAID') return false;
  if (job.paymentStatus !== 'BALANCE_DUE') return false;

  const due = job.balanceDue ?? 0;
  return due > 0;
}
