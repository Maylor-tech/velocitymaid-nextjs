/**
 * Daily Operations desk dates and job slices.
 * Calendar days are America/New_York. Service dates stored as UTC midnight
 * keep that calendar day. No payment or assignment rules live here.
 */

import { isJobAssignable } from '@/lib/billing/billingPolicy';
import { isEffectivelyOpen } from '@/lib/dispatch/offerExpiry';
import {
  addCalendarDayKey,
  easternDateKey,
  parseServiceDateInput,
} from '@/lib/dates/serviceDate';

export const OPS_TIME_ZONE = 'America/New_York';

export type OpsCalendar = {
  timeZone: typeof OPS_TIME_ZONE;
  today: string;
  tomorrow: string;
  next7End: string;
  weekStart: string;
  weekEnd: string;
};

export type OpsUrgency = 'next48' | 'thisWeek' | 'later' | 'past';

export type OpsDeskAction = 'needsCleaner' | 'waitingOnPayment';

export function opsCalendar(now: Date = new Date()): OpsCalendar {
  const today = easternDateKey(now, OPS_TIME_ZONE);
  const tomorrow = addCalendarDayKey(today, 1);
  const next7End = addCalendarDayKey(today, 6);
  const weekday = parseServiceDateInput(today)?.getUTCDay() ?? 0;
  const weekStart = addCalendarDayKey(today, -weekday);
  const weekEnd = addCalendarDayKey(weekStart, 6);
  return {
    timeZone: OPS_TIME_ZONE,
    today,
    tomorrow,
    next7End,
    weekStart,
    weekEnd,
  };
}

/** Inclusive Eastern calendar-day bounds as UTC midnights for Prisma filters. */
export function opsRangeStart(calendar: OpsCalendar): Date {
  const start = parseServiceDateInput(calendar.today);
  if (!start) throw new Error('Unable to resolve Eastern today');
  return start;
}

export function opsUrgency(serviceDate: string, calendar: OpsCalendar): OpsUrgency {
  if (serviceDate < calendar.today) return 'past';
  if (serviceDate === calendar.today || serviceDate === calendar.tomorrow) return 'next48';
  if (serviceDate <= calendar.weekEnd) return 'thisWeek';
  return 'later';
}

export function isInNext7Days(serviceDate: string, calendar: OpsCalendar): boolean {
  return serviceDate >= calendar.today && serviceDate <= calendar.next7End;
}

/**
 * Read-time exclusion for dashboard counts. Does not match records for update
 * or delete. SMK-reuse-253636 and SMK-recon-296711 stay in the database.
 */
export function isDashboardSmokeRecord(input: {
  jobReference?: string | null;
  invoiceNumber?: string | null;
  customerName?: string | null;
  clientName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): boolean {
  const reference = `${input.jobReference || ''} ${input.invoiceNumber || ''}`;
  const name = [input.customerName, input.clientName, input.firstName, input.lastName]
    .filter(Boolean)
    .join(' ');
  if (/(^|\s)SMK[-_]/i.test(reference) || /^SMK/i.test((input.invoiceNumber || input.jobReference || '').trim())) {
    return true;
  }
  if (/P0E1-SMOKE/i.test(reference) || /P0E1-SMOKE/i.test(name)) return true;
  if (/VM Hosts Prod QA/i.test(name)) return true;
  return false;
}

export function opsDeskAction(input: {
  assignedCleanerId?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  billingPolicy?: string | null;
  reviewStatus?: string | null;
}): OpsDeskAction | null {
  if (input.assignedCleanerId) return null;
  const status = (input.status || '').toUpperCase();
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'CANCELLED_EMERGENCY') {
    return null;
  }
  const assignable = isJobAssignable({
    paymentStatus: input.paymentStatus || 'PENDING',
    reviewStatus: input.reviewStatus,
    billingPolicy: input.billingPolicy,
  });
  return assignable ? 'needsCleaner' : 'waitingOnPayment';
}

export function opsRowAction(input: {
  jobId: string;
  action: OpsDeskAction | null;
  serviceDate: string;
  calendar: OpsCalendar;
  hasOpenOffer: boolean;
  invoiceId?: string | null;
  branchScoped: boolean;
}): { label: 'Assign cleaner' | 'Send offer' | 'Open'; href: string } {
  if (input.action === 'waitingOnPayment') {
    if (!input.branchScoped && input.invoiceId) {
      return { label: 'Open', href: `/admin/invoices/${input.invoiceId}` };
    }
    return { label: 'Open', href: `/admin/jobs/${input.jobId}` };
  }
  if (input.action === 'needsCleaner' && !input.hasOpenOffer) {
    const urgent = opsUrgency(input.serviceDate, input.calendar) === 'next48';
    return {
      label: urgent ? 'Assign cleaner' : 'Send offer',
      href: `/admin/jobs/${input.jobId}`,
    };
  }
  return { label: 'Open', href: `/admin/jobs/${input.jobId}` };
}

export function offerIsOpen(
  offers: Array<{ status: string; expiresAt: Date | string | null }> | undefined,
  now: Date
): boolean {
  return (offers ?? []).some((offer) => isEffectivelyOpen(offer, now));
}
