/**
 * Host-facing cleaner payout timing copy.
 * Cycle is weekly on Friday (America/New_York). Change CLEANER_PAYOUT_WEEKDAY
 * if the ops pay day changes (0 = Sunday … 5 = Friday).
 */
export const CLEANER_PAYOUT_WEEKDAY = 5;

export function nextWeeklyPayoutDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const add = (CLEANER_PAYOUT_WEEKDAY - day + 7) % 7;
  d.setDate(d.getDate() + (add === 0 ? 7 : add));
  return d;
}

export function formatPayoutDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

export function cleanerPayoutTimingCopy(params: {
  status: string;
  paidAt?: Date | string | null;
  from?: Date;
}): string {
  const status = params.status.toUpperCase();
  if (status === 'PAID' || status === 'PAID_OUT') {
    if (params.paidAt) {
      const paid =
        params.paidAt instanceof Date ? params.paidAt : new Date(params.paidAt);
      return `Paid ${formatPayoutDate(paid)}`;
    }
    return 'Paid';
  }
  if (status === 'READY' || status === 'APPROVED' || status === 'PENDING') {
    return `Expected ${formatPayoutDate(nextWeeklyPayoutDate(params.from))}`;
  }
  return 'Weekly cycle after the job is marked complete';
}
