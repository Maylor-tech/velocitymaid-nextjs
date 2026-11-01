/** Customer-facing due dates are calendar dates, not server-local instants. */
export const REMINDER_TIME_ZONE = 'America/New_York';
export type ReminderStage = 'due_soon' | 'due_today' | 'overdue_1' | 'overdue_7';

export function contactDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REMINDER_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function reminderStage(due: Date | null, now: Date): ReminderStage | null {
  if (!due || !Number.isFinite(due.getTime())) return null;
  // Invoice inputs use YYYY-MM-DD -> UTC midnight. Preserve that stored date
  // rather than shifting it to the preceding day in Vermont.
  const dueDay = Date.parse(due.toISOString().slice(0, 10));
  const age = Math.round((Date.parse(contactDate(now)) - dueDay) / 86_400_000);
  if (age === -1) return 'due_soon';
  if (age === 0) return 'due_today';
  if (age >= 7) return 'overdue_7';
  if (age >= 1) return 'overdue_1';
  return null;
}

export function inReminderSendWindow(now: Date): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: REMINDER_TIME_ZONE, hour: 'numeric', hourCycle: 'h23',
  }).format(now));
  return hour >= 8 && hour < 18;
}

export function reminderCandidates(now: Date) {
  const midnight = Date.parse(contactDate(now));
  const day = (offset: number) => new Date(midnight + offset * 86_400_000);
  const unrecorded = (stage: ReminderStage) => ({
    reminderDeliveries: { none: { stage, status: { not: 'FAILED' } } },
  });
  return [
    { dueDate: { gte: day(1), lt: day(2) }, ...unrecorded('due_soon') },
    { dueDate: { gte: day(0), lt: day(1) }, ...unrecorded('due_today') },
    { dueDate: { gte: day(-6), lt: day(0) }, ...unrecorded('overdue_1') },
    { dueDate: { lt: day(-6) }, ...unrecorded('overdue_7') },
  ];
}
