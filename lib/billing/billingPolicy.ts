/**
 * Commercial collection model — independent of Job.status and PaymentStatus.
 *
 * Host Add Cleaning is an operational request, not a prepaid consumer booking.
 * PREPAY: Stripe/deposit must clear before cleaner assignment.
 * INVOICE_AFTER_SERVICE: authorized host accounts may be assigned while payment
 * remains PENDING. Never flip paymentStatus to PAID to unlock assignment.
 */

export const BILLING_POLICIES = ['PREPAY', 'INVOICE_AFTER_SERVICE'] as const;
export type BillingPolicy = (typeof BILLING_POLICIES)[number];

export function isBillingPolicy(value: unknown): value is BillingPolicy {
  return value === 'PREPAY' || value === 'INVOICE_AFTER_SERVICE';
}

export function resolveBillingPolicy(input: {
  jobPolicy?: string | null;
  propertyPolicy?: string | null;
  customerPolicy?: string | null;
}): BillingPolicy {
  if (isBillingPolicy(input.jobPolicy)) return input.jobPolicy;
  if (isBillingPolicy(input.propertyPolicy)) return input.propertyPolicy;
  if (isBillingPolicy(input.customerPolicy)) return input.customerPolicy;
  return 'PREPAY';
}

/**
 * Whether ops may assign a cleaner.
 * Invoice-after-service jobs are assignable without being marked paid.
 */
export function isJobAssignable(job: {
  paymentStatus: string;
  reviewStatus?: string | null;
  billingPolicy?: string | null;
}): boolean {
  const policy = resolveBillingPolicy({ jobPolicy: job.billingPolicy });
  if (policy === 'INVOICE_AFTER_SERVICE') {
    return true;
  }
  if (job.paymentStatus === 'PAID') {
    return true;
  }
  if (
    job.paymentStatus === 'DEPOSIT_PAID' &&
    job.reviewStatus === 'APPROVED'
  ) {
    return true;
  }
  return false;
}

export function serviceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: 'Request received',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Team assigned',
    ON_THE_WAY: 'On the way',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    CANCELLED_EMERGENCY: 'Cancelled',
  };
  const key = status.toUpperCase();
  return map[key] ?? status.replace(/_/g, ' ').toLowerCase();
}

export function paymentStatusLabel(
  paymentStatus: string,
  billingPolicy: BillingPolicy = 'PREPAY'
): string {
  const p = paymentStatus.toUpperCase();
  if (p === 'PAID') return 'Paid';
  if (p === 'DEPOSIT_PAID') return 'Deposit paid';
  if (p === 'BALANCE_DUE') return 'Balance due';
  if (p === 'REFUNDED') return 'Refunded';
  if (p === 'FAILED') return 'Payment failed';
  if (p === 'PENDING' && billingPolicy === 'INVOICE_AFTER_SERVICE') {
    return 'Invoice after service';
  }
  if (p === 'PENDING' || p === 'UNPAID') return 'Payment required';
  return paymentStatus.replace(/_/g, ' ');
}

/** Maps Job.status onto customer-portal badge keys (visual only). */
export function mapServiceStatusToCustomerBadge(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: 'pending',
    CONFIRMED: 'scheduled',
    ASSIGNED: 'assigned',
    ON_THE_WAY: 'in_progress',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    CANCELLED_EMERGENCY: 'cancelled',
  };
  return map[status.toUpperCase()] || status.toLowerCase();
}
