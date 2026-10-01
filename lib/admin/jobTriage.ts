/**
 * Single concise "what to do with this job" reason for admin ops triage rows.
 *
 * Combines staffing, money, and schedule into one label per job, reusing the
 * existing authorities rather than duplicating business rules:
 *   - staffing/assignability: deriveStaffingState() (wraps isJobAssignable)
 *   - money: isOverduePayment() / jobHasOutstandingPayment()
 *   - billing intent: resolveBillingPolicy()
 *   - schedule: isPastDate()
 *
 * Pure and read-only — never mutates payment or status.
 */

import { deriveStaffingState } from '@/lib/admin/jobStaffingMoney';
import { resolveBillingPolicy } from '@/lib/billing/billingPolicy';
import {
  isOverduePayment,
  isPastDate,
  isUnassigned,
  jobHasOutstandingPayment,
  type JobOperationsInput,
} from '@/lib/admin/jobsOperations';

export type JobTriageKind =
  | 'past_stale'
  | 'overdue_payment'
  | 'needs_booking_approval'
  | 'payment_required'
  | 'offer_expired'
  | 'awaiting_offer'
  | 'ready_to_staff'
  | 'invoice_after_service'
  | 'staffed'
  | 'closed';

export type TriageTone =
  | 'danger'
  | 'warning'
  | 'cyan'
  | 'navy'
  | 'muted'
  | 'success';

export interface JobTriageReason {
  kind: JobTriageKind;
  label: string;
  tone: TriageTone;
}

const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY']);

const REASON: Record<JobTriageKind, { label: string; tone: TriageTone }> = {
  past_stale: { label: 'Past-dated / stale', tone: 'muted' },
  overdue_payment: { label: 'Overdue payment', tone: 'danger' },
  needs_booking_approval: { label: 'Needs booking approval', tone: 'warning' },
  payment_required: { label: 'Payment required before staffing', tone: 'warning' },
  offer_expired: { label: 'Offer expired · restaff', tone: 'warning' },
  awaiting_offer: { label: 'Awaiting cleaner response', tone: 'cyan' },
  ready_to_staff: { label: 'Ready to staff', tone: 'navy' },
  invoice_after_service: { label: 'Invoice after service', tone: 'cyan' },
  staffed: { label: 'Team assigned', tone: 'success' },
  closed: { label: 'Closed', tone: 'muted' },
};

export const TRIAGE_TONE_CLASS: Record<TriageTone, string> = {
  danger: 'bg-vm-danger-bg text-vm-danger',
  warning: 'bg-vm-warning-bg text-vm-warning',
  cyan: 'bg-vm-cyan-tint text-vm-navy',
  navy: 'bg-vm-navy/10 text-vm-navy',
  muted: 'bg-vm-surface text-vm-muted',
  success: 'bg-vm-success-bg text-vm-success',
};

export function getJobTriageReason(
  job: JobOperationsInput,
  now: Date = new Date()
): JobTriageReason {
  const build = (kind: JobTriageKind): JobTriageReason => ({
    kind,
    ...REASON[kind],
  });

  // Terminal jobs: the only live action is collecting money on a completed job.
  if (TERMINAL.has(job.status)) {
    if (job.status === 'COMPLETED' && isOverduePayment(job, now)) {
      return build('overdue_payment');
    }
    return build('closed');
  }

  // Stale: unassigned with a service date already in the past (abandoned).
  if (isUnassigned(job) && isPastDate(job.preferredDate, now)) {
    return build('past_stale');
  }

  // Overdue money on an active job (e.g. past-date assigned & unpaid).
  if (isOverduePayment(job, now)) {
    return build('overdue_payment');
  }

  // Staffing — authority is isJobAssignable via deriveStaffingState.
  const staffing = deriveStaffingState(job);
  switch (staffing.kind) {
    case 'needs_review':
      return build('needs_booking_approval');
    case 'blocked_payment':
      return build('payment_required');
    case 'offer_expired':
      return build('offer_expired');
    case 'awaiting_offer':
      return build('awaiting_offer');
    case 'ready_to_staff':
      return build('ready_to_staff');
    case 'staffed': {
      const policy = resolveBillingPolicy({ jobPolicy: job.billingPolicy });
      if (policy === 'INVOICE_AFTER_SERVICE' && jobHasOutstandingPayment(job)) {
        return build('invoice_after_service');
      }
      return build('staffed');
    }
    default:
      return build('closed');
  }
}
