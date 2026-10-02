/**
 * Host Home Board — "Needs attention" derivation + confirmation/empty-state copy.
 *
 * This is intentionally a *host-facing* surface, not an admin triage queue. It
 * only surfaces items a host can actually act on, and it never invents urgency
 * from the normal INVOICE_AFTER_SERVICE + PENDING lifecycle (an invoice-after-
 * service request legitimately stays PENDING until after the clean).
 *
 * It never filters or hides jobs — visibility is decided elsewhere by
 * `customerJobListWhere` (service lifecycle, not payment). This only annotates.
 *
 * Pure functions — safe on client and server.
 */

import { resolveBillingPolicy } from '@/lib/billing/billingPolicy';

const TERMINAL_STATUSES = new Set<string>([
  'COMPLETED',
  'CANCELLED',
  'CANCELLED_EMERGENCY',
]);

export type HostAttentionKind = 'payment' | 'details';

export interface HostAttentionItem {
  jobId: string;
  kind: HostAttentionKind;
  title: string;
  detail: string;
  href: string;
}

export interface HostAttentionJob {
  id: string;
  /** Raw service status (JobStatus), e.g. RECEIVED / COMPLETED. */
  serviceStatus?: string | null;
  paymentStatus?: string | null;
  billingPolicy?: string | null;
  /** Service / turnover date (ISO) — NOT a guest stay date. */
  scheduledDate?: string | null;
}

function isTerminal(status?: string | null): boolean {
  return status != null && TERMINAL_STATUSES.has(status);
}

/**
 * Payment is genuinely required from the host when:
 *  - the balance is due after service (any policy), or
 *  - the booking is PREPAY and still unpaid before service.
 *
 * DEPOSIT_PAID (awaiting ops approval) and PAID are not host payment actions,
 * and INVOICE_AFTER_SERVICE + PENDING is the normal pre-service state — neither
 * is surfaced as attention.
 */
function paymentActuallyRequired(job: HostAttentionJob): boolean {
  if (job.paymentStatus === 'BALANCE_DUE') return true;
  if (isTerminal(job.serviceStatus)) return false;
  const policy = resolveBillingPolicy({ jobPolicy: job.billingPolicy ?? undefined });
  if (policy !== 'PREPAY') return false;
  return job.paymentStatus === 'PENDING' || job.paymentStatus === 'FAILED';
}

/**
 * Build the host's "Needs attention" list. Returns only actionable,
 * customer-facing items; returns [] when nothing genuinely needs the host.
 */
export function getHostAttentionItems(
  jobs: HostAttentionJob[]
): HostAttentionItem[] {
  const items: HostAttentionItem[] = [];

  for (const job of jobs) {
    const href = `/customer/jobs/${job.id}`;

    if (paymentActuallyRequired(job)) {
      const balanceDue = job.paymentStatus === 'BALANCE_DUE';
      items.push({
        jobId: job.id,
        kind: 'payment',
        title: balanceDue ? 'Balance due' : 'Payment needed',
        detail: balanceDue
          ? 'Complete payment for your recent cleaning.'
          : 'This cleaning is confirmed once payment is received.',
        href,
      });
    }

    // Missing booking detail that genuinely needs host input: no service date
    // on an active (non-terminal) request. Invoice-after-service PENDING with a
    // date set is NOT flagged.
    if (!isTerminal(job.serviceStatus) && !job.scheduledDate) {
      items.push({
        jobId: job.id,
        kind: 'details',
        title: 'Add a service date',
        detail: 'Tell us when we should clean so we can schedule it.',
        href,
      });
    }
  }

  return items;
}

/**
 * Post-request confirmation copy. Host Add Cleaning is a request (Job RECEIVED /
 * PENDING) — this copy must never imply a cleaner is assigned.
 */
export const HOST_REQUEST_CONFIRMATION = {
  title: 'Cleaning request received',
  detail: "We'll review the turnover details and confirm staffing.",
} as const;

/** Empty-state copy for a host with no upcoming cleaning — calm, no alarm. */
export const HOST_EMPTY_STATE = {
  title: 'No cleaning is currently scheduled',
  detail: 'When you need a turnover, request one from your property.',
  ctaLabel: 'Add Cleaning',
} as const;
