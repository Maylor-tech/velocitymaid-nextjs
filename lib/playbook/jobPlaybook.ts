/**
 * Staff playbook — a rule-based "what to do next" engine for a job.
 *
 * This is deliberately NOT an LLM. It turns the job's real state into a short,
 * prioritised list of recommended ops actions, reusing the single sources of
 * truth we already have:
 *   - staffing/eligibility: deriveStaffingState() (which wraps isJobAssignable)
 *   - money: deriveMoneyState()
 *   - property brief completeness: evaluateHostPropertyReadiness()
 *
 * It never mutates anything and never treats "paid" as a staffing proxy — it
 * only surfaces guidance. Service lifecycle and money stay independent, exactly
 * as the strips do.
 *
 * Pure functions — safe on client and server.
 */

import {
  deriveMoneyState,
  deriveStaffingState,
  type StaffingMoneyJob,
} from '@/lib/admin/jobStaffingMoney';
import { evaluateHostPropertyReadiness } from '@/lib/properties/propertyReadiness';

export type PlaybookPriority = 'now' | 'soon' | 'later';

export interface PlaybookStep {
  id: string;
  priority: PlaybookPriority;
  title: string;
  detail: string;
}

export interface JobPlaybook {
  /** Ordered now → soon → later, stable within a tier. */
  steps: PlaybookStep[];
  /** The single most important next action, or an all-clear message. */
  headline: string;
  /** How many steps are "do it now". */
  urgentCount: number;
}

export interface PlaybookJob extends StaffingMoneyJob {
  /** Service / turnover date. */
  preferredDate?: string | Date | null;
  guestCheckInDate?: string | Date | null;
  guestCheckOutDate?: string | Date | null;
  completedAt?: string | Date | null;
  property?: {
    accessType?: string | null;
    standingInstructions?: string | null;
  } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Service date within this many days makes staffing/payment gaps "do it now". */
const IMMINENT_DAYS = 2;

const PRIORITY_ORDER: Record<PlaybookPriority, number> = {
  now: 0,
  soon: 1,
  later: 2,
};

const TERMINAL_STATUSES = new Set([
  'COMPLETED',
  'CANCELLED',
  'CANCELLED_EMERGENCY',
]);

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days from `now` until `date` (negative = in the past), by UTC day. */
function daysUntil(date: Date, now: Date): number {
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / DAY_MS);
}

/**
 * Build the prioritised next-action playbook for a job.
 * `now` is injectable for deterministic tests.
 */
export function buildJobPlaybook(
  job: PlaybookJob,
  now: Date = new Date()
): JobPlaybook {
  const steps: PlaybookStep[] = [];

  const staffing = deriveStaffingState(job);
  const money = deriveMoneyState(job);
  const isTerminal = TERMINAL_STATUSES.has(job.status);

  const serviceDate = toDate(job.preferredDate);
  const daysToService = serviceDate ? daysUntil(serviceDate, now) : null;
  const imminent =
    daysToService !== null && daysToService >= 0 && daysToService <= IMMINENT_DAYS;

  // --- Staffing guidance (never for terminal jobs) ---
  if (!isTerminal) {
    switch (staffing.kind) {
      case 'blocked_payment':
        steps.push({
          id: 'collect-payment',
          priority: imminent ? 'now' : 'soon',
          title: 'Collect payment to unlock staffing',
          detail:
            'Prepay booking — assignment stays blocked until payment clears. Do not mark it paid to unlock staffing.',
        });
        break;
      case 'needs_review':
        steps.push({
          id: 'approve-booking',
          priority: 'now',
          title: 'Approve the booking',
          detail:
            'Deposit paid and awaiting review — approve it to release the job for staffing.',
        });
        break;
      case 'offer_expired':
        steps.push({
          id: 'restaff',
          priority: 'now',
          title: 'Re-staff — the offer expired',
          detail: 'The last cleaner offer lapsed. Send a new offer or assign directly.',
        });
        break;
      case 'ready_to_staff':
        steps.push({
          id: 'assign-cleaner',
          priority: imminent ? 'now' : 'soon',
          title: 'Assign a cleaner',
          detail: imminent
            ? `Service is ${
                daysToService === 0
                  ? 'today'
                  : daysToService === 1
                    ? 'tomorrow'
                    : `in ${daysToService} days`
              } and no one is assigned yet.`
            : 'Billing policy permits assignment — send an offer or assign directly.',
        });
        break;
      case 'awaiting_offer':
        steps.push({
          id: 'awaiting-offer',
          priority: 'later',
          title: 'Offer is out — awaiting response',
          detail: `${staffing.label}. No action needed unless it lapses.`,
        });
        break;
      // 'staffed' and 'closed' need no staffing prompt.
    }
  }

  // --- Property brief completeness (active, assignable/assigned jobs) ---
  if (
    !isTerminal &&
    job.property &&
    (staffing.kind === 'ready_to_staff' ||
      staffing.kind === 'staffed' ||
      staffing.kind === 'awaiting_offer' ||
      staffing.kind === 'offer_expired')
  ) {
    const readiness = evaluateHostPropertyReadiness(job.property);
    if (!readiness.ready) {
      steps.push({
        id: 'complete-brief',
        priority: imminent ? 'now' : 'soon',
        title: 'Complete the property brief',
        detail: `Cleaner is missing ${readiness.missingRequired
          .map((item) => item.label.toLowerCase())
          .join(' and ')} — fill it in so they arrive ready.`,
      });
    }
  }

  // --- Money guidance (independent of staffing) ---
  if (money.tone === 'failed') {
    steps.push({
      id: 'payment-failed',
      priority: 'now',
      title: 'Payment failed — follow up',
      detail: 'The last charge failed. Contact the customer or retry the payment.',
    });
  } else if (
    isTerminal &&
    job.status === 'COMPLETED' &&
    money.policy === 'INVOICE_AFTER_SERVICE' &&
    money.tone !== 'paid'
  ) {
    steps.push({
      id: 'send-invoice',
      priority: 'now',
      title: 'Send the invoice',
      detail:
        'Service is complete on invoice-after-service terms — bill the customer for this job.',
    });
  } else if (job.paymentStatus.toUpperCase() === 'BALANCE_DUE') {
    steps.push({
      id: 'collect-balance',
      priority: 'soon',
      title: 'Collect the balance due',
      detail: 'A balance remains after the deposit — collect it to close out the job.',
    });
  }

  steps.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const urgentCount = steps.filter((s) => s.priority === 'now').length;
  const headline = steps.length === 0 ? 'No action needed right now' : steps[0].title;

  return { steps, headline, urgentCount };
}
