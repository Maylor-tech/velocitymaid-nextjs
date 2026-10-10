import { resolveJobBalanceCollection } from '@/lib/billing/authorizedCollection';

export type PayBalanceJobSnapshot = {
  id?: string;
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
  if (job.reviewStatus === 'REJECTED') return false;
  if (job.billingPolicy === 'INVOICE_AFTER_SERVICE') return false;
  if (job.paymentStatus === 'PAID') return false;
  if (job.paymentStatus !== 'BALANCE_DUE') return false;

  const due = job.balanceDue ?? 0;
  if (due <= 0) return false;
  if (job.id) {
    const collection = resolveJobBalanceCollection({
      jobId: job.id,
      jobBalanceDue: due,
      invoice: null,
    });
    if (!collection.allowed) return false;
  }
  return true;
}

/** Invoice-after-service: pay via public invoice page, not Stripe job-balance checkout. */
export function canShowInvoicePay(job: {
  status: string;
  billingPolicy?: string | null;
  paymentStatus?: string | null;
  invoicePayUrl?: string | null;
}): boolean {
  const normalizedStatus = job.status.toUpperCase();
  if (normalizedStatus !== 'COMPLETED') return false;
  if (job.billingPolicy !== 'INVOICE_AFTER_SERVICE') return false;
  if (job.paymentStatus === 'PAID' || job.paymentStatus === 'REFUNDED') return false;
  return Boolean(job.invoicePayUrl);
}
