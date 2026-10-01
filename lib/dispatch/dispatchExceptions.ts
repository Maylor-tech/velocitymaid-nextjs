/**
 * Admin dispatch exception classification (Phase 6A).
 * Pure functions — no Prisma, no notifications, no TTL changes.
 */

import { businessDateKey, parseServiceDateInput, serviceDateKey } from '@/lib/dates/serviceDate';
import { isJobAssignable } from '@/lib/billing/billingPolicy';
import { effectiveOfferStatus, isEffectivelyOpen } from '@/lib/dispatch/offerExpiry';

type ExceptionUrgency = 'normal' | 'warning' | 'danger';

export type DispatchExceptionKind =
  | 'TODAY_UNASSIGNED'
  | 'TOMORROW_UNASSIGNED'
  | 'NEEDS_BOOKING_APPROVAL'
  | 'NOTIFICATION_FAILED'
  | 'EXPIRED_OR_DECLINED'
  | 'AWAITING_RESPONSE'
  | 'CLEANER_NEEDED_NO_OFFER'
  | 'PAYMENT_REQUIRED';

export type DispatchExceptionInput = {
  assignedCleanerId: string | null;
  preferredDate: Date | string | null;
  status?: string | null;
  offers?: Array<{ status: string; expiresAt: Date | string | null }>;
  latestOfferEmailStatus?: 'SUCCESS' | 'FAILED' | string | null;
  /**
   * Billing fields. When `paymentStatus` is provided, classification becomes
   * billing-aware: jobs that isJobAssignable() would block never surface as
   * "send offer" dispatch work. Omit them to keep legacy date/offer behavior.
   */
  paymentStatus?: string | null;
  billingPolicy?: string | null;
  reviewStatus?: string | null;
};

const TERMINAL_JOB = new Set(['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY']);

export function serviceDayBucket(
  preferredDate: Date | string | null,
  now: Date
): 'today' | 'tomorrow' | 'other' {
  const jobKey = businessDateKey(preferredDate);
  const todayKey = businessDateKey(now);
  if (!jobKey || !todayKey) return 'other';
  if (jobKey === todayKey) return 'today';
  const todayUtc = parseServiceDateInput(todayKey);
  if (!todayUtc) return 'other';
  const tomorrowKey = serviceDateKey(
    new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000)
  );
  if (tomorrowKey && jobKey === tomorrowKey) return 'tomorrow';
  return 'other';
}

export function summarizeOffers(
  offers: Array<{ status: string; expiresAt: Date | string | null }> | undefined,
  now: Date
): { hasOpenOffer: boolean; latestTerminalStatus: string | null } {
  const rows = offers ?? [];
  const open = rows.find((o) => isEffectivelyOpen(o, now)) ?? null;
  const terminal = rows.find((o) => !isEffectivelyOpen(o, now)) ?? null;
  return {
    hasOpenOffer: Boolean(open),
    latestTerminalStatus: terminal
      ? effectiveOfferStatus(terminal, now)
      : null,
  };
}

/**
 * One primary exception per unassigned job.
 * Priority: today → tomorrow → notification failed → expired/declined →
 * awaiting response → cleaner needed with no active offer.
 */
export function classifyDispatchException(
  input: DispatchExceptionInput,
  now: Date = new Date()
): DispatchExceptionKind | null {
  if (input.assignedCleanerId) return null;
  const status = (input.status || '').toUpperCase();
  if (TERMINAL_JOB.has(status)) return null;

  // Billing-aware gate (opt-in: only when paymentStatus is supplied). Mirrors
  // isJobAssignable() — the same policy the Staffing strip/playbook use — so a
  // payment-blocked job is surfaced as a money/review action, never as a
  // staffable "send offer" item. Never mutates payment state.
  if (input.paymentStatus != null) {
    const assignable = isJobAssignable({
      paymentStatus: input.paymentStatus,
      reviewStatus: input.reviewStatus,
      billingPolicy: input.billingPolicy,
    });
    if (!assignable) {
      if (
        input.paymentStatus.toUpperCase() === 'DEPOSIT_PAID' &&
        (input.reviewStatus || '').toUpperCase() === 'PENDING'
      ) {
        return 'NEEDS_BOOKING_APPROVAL';
      }
      return 'PAYMENT_REQUIRED';
    }
  }

  const day = serviceDayBucket(input.preferredDate, now);
  if (day === 'today') return 'TODAY_UNASSIGNED';
  if (day === 'tomorrow') return 'TOMORROW_UNASSIGNED';

  if (input.latestOfferEmailStatus === 'FAILED') {
    return 'NOTIFICATION_FAILED';
  }

  const { hasOpenOffer, latestTerminalStatus } = summarizeOffers(
    input.offers,
    now
  );

  if (
    !hasOpenOffer &&
    (latestTerminalStatus === 'DECLINED' || latestTerminalStatus === 'EXPIRED')
  ) {
    return 'EXPIRED_OR_DECLINED';
  }
  if (hasOpenOffer) return 'AWAITING_RESPONSE';
  return 'CLEANER_NEEDED_NO_OFFER';
}

export const DISPATCH_EXCEPTION_META: Record<
  DispatchExceptionKind,
  {
    id: string;
    label: string;
    reason: string;
    cta: string;
    urgency: ExceptionUrgency;
    priority: number;
  }
> = {
  TODAY_UNASSIGNED: {
    id: 'dispatch-today-unassigned',
    label: 'Today unassigned',
    reason: 'Service is today and no cleaner is assigned.',
    cta: 'Open jobs',
    urgency: 'danger',
    priority: 10,
  },
  TOMORROW_UNASSIGNED: {
    id: 'dispatch-tomorrow-unassigned',
    label: 'Tomorrow unassigned',
    reason: 'Job is tomorrow and still unassigned.',
    cta: 'Open jobs',
    urgency: 'danger',
    priority: 20,
  },
  NEEDS_BOOKING_APPROVAL: {
    id: 'dispatch-needs-booking-approval',
    label: 'Needs booking approval',
    reason: 'Deposit paid — approve the booking to release it for staffing.',
    cta: 'Review booking',
    urgency: 'warning',
    priority: 25,
  },
  NOTIFICATION_FAILED: {
    id: 'dispatch-notification-failed',
    label: 'Notification failed',
    reason: 'Offer email did not send. No automatic retry.',
    cta: 'Open job',
    urgency: 'warning',
    priority: 30,
  },
  EXPIRED_OR_DECLINED: {
    id: 'dispatch-expired-declined',
    label: 'Expired / declined — cleaner needed',
    reason: 'The last offer ended and the job still needs a cleaner.',
    cta: 'Send offer',
    urgency: 'warning',
    priority: 40,
  },
  AWAITING_RESPONSE: {
    id: 'dispatch-awaiting',
    label: 'Awaiting cleaner response',
    reason: 'An offer is outstanding. Wait or cancel from Dispatch.',
    cta: 'View offer',
    urgency: 'normal',
    priority: 50,
  },
  CLEANER_NEEDED_NO_OFFER: {
    id: 'dispatch-cleaner-needed',
    label: 'Cleaner needed — no active offer',
    reason: 'Unassigned with no live offer.',
    cta: 'Send offer',
    urgency: 'warning',
    priority: 60,
  },
  PAYMENT_REQUIRED: {
    id: 'dispatch-payment-required',
    label: 'Payment required before staffing',
    reason: 'Prepay booking — assignment stays blocked until payment clears.',
    cta: 'Open job',
    urgency: 'normal',
    priority: 65,
  },
};

export type ClassifiedDispatchJob = {
  id: string;
  name: string;
  kind: DispatchExceptionKind;
};

export function groupDispatchExceptionItems(jobs: ClassifiedDispatchJob[]): Array<{
  id: string;
  label: string;
  count: number;
  href: string;
  urgency: ExceptionUrgency;
  reason: string;
  cta: string;
  branchScopedVisible: boolean;
  priority: number;
  entities: Array<{
    id: string;
    name: string;
    href: string;
    action: 'open';
  }>;
}> {
  const order: DispatchExceptionKind[] = [
    'TODAY_UNASSIGNED',
    'TOMORROW_UNASSIGNED',
    'NEEDS_BOOKING_APPROVAL',
    'NOTIFICATION_FAILED',
    'EXPIRED_OR_DECLINED',
    'AWAITING_RESPONSE',
    'CLEANER_NEEDED_NO_OFFER',
    'PAYMENT_REQUIRED',
  ];
  return order.map((kind) => {
    const meta = DISPATCH_EXCEPTION_META[kind];
    const matches = jobs.filter((j) => j.kind === kind);
    return {
      id: meta.id,
      label: meta.label,
      count: matches.length,
      href: '/admin/jobs?needsAssignment=1',
      urgency: meta.urgency,
      reason: meta.reason,
      cta: meta.cta,
      branchScopedVisible: true,
      priority: meta.priority,
      entities: matches.slice(0, 5).map((j) => ({
        id: j.id,
        name: j.name,
        href: `/admin/jobs/${j.id}`,
        action: 'open' as const,
      })),
    };
  });
}
