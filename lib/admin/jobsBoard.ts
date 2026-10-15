/**
 * Jobs Operations board views. Pure classification — no Prisma, no writes.
 *
 * Inbox: current/future RECEIVED, newest arrival first.
 * Today: Eastern service date is today, already scheduled (not RECEIVED / COMPLETED).
 * Upcoming: future scheduled jobs.
 * Completed: COMPLETED only.
 * Exceptions: past Eastern service date, not COMPLETED/CANCELLED.
 */

import {
  addCalendarDayKey,
  easternDateKey,
  parseServiceDateInput,
  serviceDayRelativeToEastern,
} from '@/lib/dates/serviceDate';

export const JOBS_BOARD_VIEWS = [
  'inbox',
  'today',
  'upcoming',
  'completed',
  'exceptions',
] as const;

export type JobsBoardView = (typeof JOBS_BOARD_VIEWS)[number];

const CANCELLED = new Set(['CANCELLED', 'CANCELLED_EMERGENCY']);
const SCHEDULED = new Set(['CONFIRMED', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS']);

export type JobsBoardJob = {
  id: string;
  status: string;
  preferredDate: string | null;
  preferredTime?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
};

export function isJobsBoardView(value: string | null | undefined): value is JobsBoardView {
  return JOBS_BOARD_VIEWS.includes(value as JobsBoardView);
}

export function jobBoardView(
  job: JobsBoardJob,
  now: Date = new Date()
): JobsBoardView | null {
  const status = job.status.toUpperCase();
  if (CANCELLED.has(status)) return null;

  const day = serviceDayRelativeToEastern(job.preferredDate, now);

  if (status === 'COMPLETED') return 'completed';
  if (day === 'past') return 'exceptions';
  if (status === 'RECEIVED') return 'inbox';
  if (day === 'today' && SCHEDULED.has(status)) return 'today';
  if (day === 'future' && SCHEDULED.has(status)) return 'upcoming';
  if (day === 'unscheduled' && SCHEDULED.has(status)) return 'inbox';
  return null;
}

export function filterJobsBoardView<T extends JobsBoardJob>(
  jobs: T[],
  view: JobsBoardView,
  now: Date = new Date()
): T[] {
  return jobs.filter((job) => jobBoardView(job, now) === view);
}

export function sortJobsBoardView<T extends JobsBoardJob>(
  jobs: T[],
  view: JobsBoardView
): T[] {
  const copy = [...jobs];
  const time = (job: T) => job.preferredTime || '';
  const created = (job: T) => (job.createdAt ? new Date(job.createdAt).getTime() : 0);
  const service = (job: T) => job.preferredDate || '';
  const completed = (job: T) =>
    job.completedAt ? new Date(job.completedAt).getTime() : 0;

  switch (view) {
    case 'inbox':
      return copy.sort((a, b) => created(b) - created(a));
    case 'today':
      return copy.sort((a, b) => {
        const t = time(a).localeCompare(time(b));
        if (t !== 0) return t;
        return created(a) - created(b);
      });
    case 'upcoming':
      return copy.sort((a, b) => {
        const d = service(a).localeCompare(service(b));
        if (d !== 0) return d;
        return time(a).localeCompare(time(b));
      });
    case 'completed':
      return copy.sort((a, b) => completed(b) - completed(a) || created(b) - created(a));
    case 'exceptions':
      return copy.sort((a, b) => service(a).localeCompare(service(b)) || created(a) - created(b));
    default:
      return copy;
  }
}

export function jobsBoardDateBounds(now: Date = new Date()): {
  todayKey: string;
  today: Date;
  tomorrow: Date;
} {
  const todayKey = easternDateKey(now);
  const today = parseServiceDateInput(todayKey);
  const tomorrow = parseServiceDateInput(addCalendarDayKey(todayKey, 1));
  if (!today || !tomorrow) {
    throw new Error('Unable to resolve Eastern service-date bounds');
  }
  return { todayKey, today, tomorrow };
}

export function boardViewCounts<T extends JobsBoardJob>(
  jobs: T[],
  now: Date = new Date()
): Record<JobsBoardView, number> {
  const counts: Record<JobsBoardView, number> = {
    inbox: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
    exceptions: 0,
  };
  for (const job of jobs) {
    const view = jobBoardView(job, now);
    if (view) counts[view] += 1;
  }
  return counts;
}
