/**
 * Rebooking reminder candidate filters and skip rules.
 *
 * Customer.email is a required String in Prisma — never filter `{ not: null }`.
 * Empty/missing emails are skipped in application code after the query.
 */

import type { Prisma } from '@prisma/client';

export const REBOOKING_REMINDER_ACTION = 'REBOOKING_REMINDER_SENT';

export const REBOOKING_EXCLUDED_STATUSES = [
  'CANCELLED',
  'CANCELLED_EMERGENCY',
] as const;

export function hasSendableCustomerEmail(
  email: string | null | undefined
): boolean {
  return typeof email === 'string' && email.trim().length > 0;
}

export function rebookingCandidateWhere(
  checkoutStart: Date,
  checkoutEnd: Date
): Prisma.JobWhereInput {
  return {
    preferredDate: { gte: checkoutStart, lt: checkoutEnd },
    customerId: { not: null },
    archivedAt: null,
    status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
  };
}

export function upcomingTurnoverWhere(
  customerId: string,
  jobId: string,
  followUpStart: Date,
  followUpEnd: Date
): Prisma.JobWhereInput {
  return {
    customerId,
    id: { not: jobId },
    archivedAt: null,
    status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
    preferredDate: { gte: followUpStart, lt: followUpEnd },
    OR: [
      { serviceType: { contains: 'Turnover', mode: 'insensitive' } },
      { serviceType: { contains: 'turnover', mode: 'insensitive' } },
    ],
  };
}

export type RebookingEvalJob = {
  id: string;
  customerId: string | null;
  preferredDate: Date | null;
  status?: string | null;
  Customer?: { email?: string | null } | null;
};

export function evaluateRebookingReminder(input: {
  job: RebookingEvalJob;
  alreadyReminded: boolean;
  upcomingTurnoverScheduled: boolean;
}): { send: boolean; skipReason?: string } {
  const { job, alreadyReminded, upcomingTurnoverScheduled } = input;

  if (
    job.status === 'CANCELLED' ||
    job.status === 'CANCELLED_EMERGENCY'
  ) {
    return { send: false, skipReason: 'cancelled' };
  }

  if (alreadyReminded) {
    return { send: false, skipReason: 'already-reminded' };
  }

  if (!job.customerId || !job.preferredDate) {
    return { send: false, skipReason: 'missing-customer-or-date' };
  }

  if (upcomingTurnoverScheduled) {
    return { send: false, skipReason: 'upcoming-turnover' };
  }

  if (!hasSendableCustomerEmail(job.Customer?.email)) {
    return { send: false, skipReason: 'no-email' };
  }

  return { send: true };
}
