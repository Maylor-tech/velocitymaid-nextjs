/**
 * Admin job Staffing + Money strips — derivation.
 *
 * Service lifecycle (Job.status) and money (paymentStatus) stay independent.
 * Staffing eligibility derives ONLY from the shared isJobAssignable() policy —
 * we never read "paid" as a proxy for "staffable", and never mutate payment
 * state to unlock staffing.
 *
 *  - INVOICE_AFTER_SERVICE + PENDING  -> Staffing "Ready to staff", Money "Invoice after service"
 *  - PREPAY unpaid                    -> Staffing "Blocked · payment required" (money gates assignment)
 *  - Terminal (completed / cancelled) -> no staffing urgency
 *
 * Pure functions — safe on client and server.
 */

import {
  isJobAssignable,
  paymentStatusLabel,
  resolveBillingPolicy,
  type BillingPolicy,
} from '@/lib/billing/billingPolicy';
import { effectiveOfferStatus, isEffectivelyOpen } from '@/lib/dispatch/offerExpiry';

const TERMINAL_STATUSES = new Set([
  'COMPLETED',
  'CANCELLED',
  'CANCELLED_EMERGENCY',
]);

export type StaffingOffer = {
  status: string;
  expiresAt: string | Date | null;
  cleanerName?: string | null;
} | null;

export interface StaffingMoneyJob {
  status: string;
  paymentStatus: string;
  reviewStatus?: string | null;
  billingPolicy?: string | null;
  assignedCleanerId?: string | null;
  openOffer?: StaffingOffer;
}

export type StaffingKind =
  | 'closed' // terminal — kept in history, never urgent
  | 'staffed' // a cleaner/team is assigned
  | 'awaiting_offer' // an offer is open with a cleaner
  | 'offer_expired' // offer lapsed — needs restaffing
  | 'ready_to_staff' // billing policy permits assignment, no cleaner yet
  | 'needs_review' // deposit paid, booking approval still pending (PREPAY)
  | 'blocked_payment'; // PREPAY unpaid — payment must clear before assignment

export interface StaffingState {
  kind: StaffingKind;
  label: string;
  cls: string;
  /** Needs an ops staffing action now. Terminal and payment-blocked are never urgent. */
  urgent: boolean;
  /** Whether billing policy currently permits assignment (mirrors isJobAssignable). */
  assignable: boolean;
}

export type MoneyTone =
  | 'paid'
  | 'partial'
  | 'invoice'
  | 'due'
  | 'refunded'
  | 'failed';

export interface MoneyState {
  label: string;
  cls: string;
  tone: MoneyTone;
  policy: BillingPolicy;
}

const STAFF_CLS: Record<string, string> = {
  success: 'bg-vm-success-bg text-vm-success',
  cyan: 'bg-vm-cyan-tint text-vm-navy',
  navy: 'bg-vm-navy/10 text-vm-navy',
  warning: 'bg-vm-warning-bg text-vm-warning',
  muted: 'bg-vm-surface text-vm-muted',
};

/**
 * Derive the staffing state for a job. Eligibility comes from isJobAssignable()
 * — the one source of truth for whether billing policy permits assignment.
 */
export function deriveStaffingState(job: StaffingMoneyJob): StaffingState {
  const assignable = isJobAssignable({
    paymentStatus: job.paymentStatus,
    reviewStatus: job.reviewStatus,
    billingPolicy: job.billingPolicy,
  });

  // Terminal jobs keep their history but never raise staffing urgency.
  if (TERMINAL_STATUSES.has(job.status)) {
    return {
      kind: 'closed',
      label: 'Closed',
      cls: STAFF_CLS.muted,
      urgent: false,
      assignable,
    };
  }

  if (job.assignedCleanerId) {
    return {
      kind: 'staffed',
      label: 'Team assigned',
      cls: STAFF_CLS.success,
      urgent: false,
      assignable,
    };
  }

  // Unassigned + active. Money gates assignment for PREPAY — surface that as a
  // payment block, NOT a staffing prompt (urgency belongs on the Money strip).
  if (!assignable) {
    if (
      job.paymentStatus === 'DEPOSIT_PAID' &&
      job.reviewStatus === 'PENDING'
    ) {
      return {
        kind: 'needs_review',
        label: 'Needs booking approval',
        cls: STAFF_CLS.warning,
        urgent: true,
        assignable,
      };
    }
    return {
      kind: 'blocked_payment',
      label: 'Blocked · payment required',
      cls: STAFF_CLS.muted,
      urgent: false,
      assignable,
    };
  }

  // Assignable + unassigned → open offer, lapsed offer, or ready to staff.
  if (isEffectivelyOpen(job.openOffer ?? undefined)) {
    return {
      kind: 'awaiting_offer',
      label: job.openOffer?.cleanerName
        ? `Awaiting ${job.openOffer.cleanerName}`
        : 'Offer sent',
      cls: STAFF_CLS.cyan,
      urgent: false,
      assignable,
    };
  }

  if (job.openOffer && effectiveOfferStatus(job.openOffer) === 'EXPIRED') {
    return {
      kind: 'offer_expired',
      label: 'Offer expired · restaff',
      cls: STAFF_CLS.warning,
      urgent: true,
      assignable,
    };
  }

  return {
    kind: 'ready_to_staff',
    label: 'Ready to staff',
    cls: STAFF_CLS.navy,
    urgent: true,
    assignable,
  };
}

/**
 * Derive the money state for a job — purely descriptive and policy-aware.
 * Independent of staffing: an INVOICE_AFTER_SERVICE PENDING job reads
 * "Invoice after service" here while Staffing reads "Ready to staff".
 */
export function deriveMoneyState(job: StaffingMoneyJob): MoneyState {
  const policy = resolveBillingPolicy({ jobPolicy: job.billingPolicy });
  const label = paymentStatusLabel(job.paymentStatus, policy);
  const p = job.paymentStatus.toUpperCase();

  if (p === 'PAID') {
    return { label, cls: STAFF_CLS.success, tone: 'paid', policy };
  }
  if (p === 'DEPOSIT_PAID') {
    return { label, cls: STAFF_CLS.cyan, tone: 'partial', policy };
  }
  if (p === 'REFUNDED') {
    return { label, cls: STAFF_CLS.muted, tone: 'refunded', policy };
  }
  if (p === 'FAILED') {
    return {
      label,
      cls: 'bg-vm-danger-bg text-vm-danger',
      tone: 'failed',
      policy,
    };
  }
  if (p === 'BALANCE_DUE') {
    return { label, cls: STAFF_CLS.warning, tone: 'due', policy };
  }
  if (p === 'PENDING' || p === 'UNPAID') {
    // Invoice-after-service PENDING is expected, not an alarm; PREPAY PENDING is.
    if (policy === 'INVOICE_AFTER_SERVICE') {
      return { label, cls: STAFF_CLS.cyan, tone: 'invoice', policy };
    }
    return { label, cls: STAFF_CLS.warning, tone: 'due', policy };
  }
  return { label, cls: STAFF_CLS.muted, tone: 'due', policy };
}
