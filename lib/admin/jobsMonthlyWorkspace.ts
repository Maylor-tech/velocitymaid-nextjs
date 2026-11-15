/**
 * Command Center V2 — Monthly Jobs Workspace helpers.
 * Pure functions: month bounds, calendar grid, sorting, summary buckets.
 * Eastern calendar context; preferredDate remains date-only UTC midnight.
 */

import {
  addCalendarDayKey,
  easternDateKey,
  parseServiceDateInput,
  serviceDateKey,
} from '@/lib/dates/serviceDate';

export const MONTH_KEY_RE = /^(\d{4})-(\d{2})$/;
export const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Service statuses that represent scheduled (non-request, non-terminal) work. */
export const ACTIVE_SCHEDULED_STATUSES = [
  'CONFIRMED',
  'ASSIGNED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_QC',
] as const;

export const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_EMERGENCY'] as const;

export const CONFIRMED_SERVICE_STATUSES = [
  'CONFIRMED',
  'ASSIGNED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_QC',
  'COMPLETED',
] as const;

export type MonthlyWorkspaceView = 'calendar' | 'list';

export type MonthlyFocus =
  | 'all'
  | 'requests'
  | 'unscheduled'
  | 'unassigned'
  | 'qc'
  | 'completed'
  | 'cancelled'
  | 'past_incomplete'
  | 'archived';

export type MonthlySummary = {
  totalInScope: number;
  bookingRequests: number;
  confirmedServiceJobs: number;
  assignedServiceJobs: number;
  completedServiceJobs: number;
  cancelledJobs: number;
  unassignedConfirmedDemand: number;
  qcPendingJobs: number;
  missingPrice: number;
  unscheduledJobs: number;
  /** Sum of totalPrice/quotedTotal for confirmed+ jobs with a known price. */
  serviceValueCentsLike: number;
  serviceValueJobCount: number;
  /** Deferred — Invoice↔Job scope not verified for R1. */
  collectedRevenue: 'unavailable';
  outstandingInvoices: 'unavailable';
};

export type MonthlyJobSortInput = {
  id: string;
  preferredDate: string | null;
  preferredTime?: string | null;
};

export function isMonthKey(value: string | null | undefined): value is string {
  if (!value || !MONTH_KEY_RE.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function isDayKey(value: string | null | undefined): value is string {
  if (!value || !DAY_KEY_RE.test(value)) return false;
  return Boolean(parseServiceDateInput(value));
}

export function currentMonthKey(now: Date = new Date()): string {
  return easternDateKey(now).slice(0, 7);
}

export function addCalendarMonthKey(monthKey: string, delta: number): string {
  if (!isMonthKey(monthKey)) return monthKey;
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Inclusive start / exclusive end as UTC-midnight Date for Prisma preferredDate. */
export function monthDateBounds(monthKey: string): {
  start: Date;
  endExclusive: Date;
  startKey: string;
  endKeyInclusive: string;
} {
  if (!isMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  const startKey = `${monthKey}-01`;
  const start = parseServiceDateInput(startKey);
  if (!start) throw new Error(`Invalid month start: ${startKey}`);
  const nextMonth = addCalendarMonthKey(monthKey, 1);
  const endExclusive = parseServiceDateInput(`${nextMonth}-01`);
  if (!endExclusive) throw new Error(`Invalid month end: ${nextMonth}`);
  const lastDay = new Date(endExclusive.getTime() - 24 * 60 * 60 * 1000);
  const endKeyInclusive = serviceDateKey(lastDay)!;
  return { start, endExclusive, startKey, endKeyInclusive };
}

/** Eastern Sunday–Saturday week containing `now`. */
export function easternWeekBounds(now: Date = new Date()): {
  startKey: string;
  endKeyInclusive: string;
  start: Date;
  endExclusive: Date;
} {
  const today = easternDateKey(now);
  // en-US weekday in Eastern: 0=Sun … 6=Sat
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(now);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dow = map[weekdayName] ?? 0;
  const startKey = addCalendarDayKey(today, -dow);
  const endKeyInclusive = addCalendarDayKey(startKey, 6);
  const start = parseServiceDateInput(startKey)!;
  const endExclusive = parseServiceDateInput(addCalendarDayKey(endKeyInclusive, 1))!;
  return { startKey, endKeyInclusive, start, endExclusive };
}

export type CalendarCell = {
  key: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
};

/** Sunday-first grid covering the visible month. */
export function buildMonthCalendarGrid(
  monthKey: string,
  now: Date = new Date()
): CalendarCell[] {
  const { startKey, endKeyInclusive } = monthDateBounds(monthKey);
  const todayKey = easternDateKey(now);
  const start = parseServiceDateInput(startKey)!;
  const startDow = start.getUTCDay(); // 0=Sun
  const gridStart = addCalendarDayKey(startKey, -startDow);
  const end = parseServiceDateInput(endKeyInclusive)!;
  const endDow = end.getUTCDay();
  const gridEnd = addCalendarDayKey(endKeyInclusive, 6 - endDow);

  const cells: CalendarCell[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    cells.push({
      key: cursor,
      dayOfMonth: Number(cursor.slice(8, 10)),
      inMonth: cursor.startsWith(monthKey),
      isToday: cursor === todayKey,
    });
    cursor = addCalendarDayKey(cursor, 1);
  }
  return cells;
}

export function normalizeServiceTime(time: string | null | undefined): string {
  const t = (time || '').trim();
  return t.length > 0 ? t : '';
}

export function isUnknownServiceTime(time: string | null | undefined): boolean {
  return normalizeServiceTime(time) === '';
}

/** Deterministic: service date ASC, time ASC (unknown last), id ASC. */
export function sortJobsDeterministic<T extends MonthlyJobSortInput>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const da = a.preferredDate || '9999-99-99';
    const db = b.preferredDate || '9999-99-99';
    if (da !== db) return da < db ? -1 : 1;

    const ta = normalizeServiceTime(a.preferredTime);
    const tb = normalizeServiceTime(b.preferredTime);
    if (!ta && tb) return 1;
    if (ta && !tb) return -1;
    if (ta !== tb) return ta.localeCompare(tb);

    return a.id.localeCompare(b.id);
  });
}

export type SummaryJobInput = {
  status: string;
  preferredDate: string | null;
  assignedCleanerId?: string | null;
  totalPrice?: number | null;
  quotedTotal?: number | null;
  archivedAt?: string | null;
};

export function emptyMonthlySummary(): MonthlySummary {
  return {
    totalInScope: 0,
    bookingRequests: 0,
    confirmedServiceJobs: 0,
    assignedServiceJobs: 0,
    completedServiceJobs: 0,
    cancelledJobs: 0,
    unassignedConfirmedDemand: 0,
    qcPendingJobs: 0,
    missingPrice: 0,
    unscheduledJobs: 0,
    serviceValueCentsLike: 0,
    serviceValueJobCount: 0,
    collectedRevenue: 'unavailable',
    outstandingInvoices: 'unavailable',
  };
}

/**
 * Bucket counts from the full authorized filtered set (not a page slice).
 * Cancelled never counts as active demand. RECEIVED never counts as confirmed revenue.
 */
export function computeMonthlySummary(
  jobs: SummaryJobInput[],
  now: Date = new Date()
): MonthlySummary {
  const today = easternDateKey(now);
  const summary = emptyMonthlySummary();
  summary.totalInScope = jobs.length;

  for (const job of jobs) {
    const status = job.status.toUpperCase();
    const price = job.totalPrice ?? job.quotedTotal ?? null;
    const hasPrice = price != null && Number(price) > 0;
    const cancelled = CANCELLED_STATUSES.includes(
      status as (typeof CANCELLED_STATUSES)[number]
    );
    const scheduled = ACTIVE_SCHEDULED_STATUSES.includes(
      status as (typeof ACTIVE_SCHEDULED_STATUSES)[number]
    );

    if (!job.preferredDate) summary.unscheduledJobs += 1;
    if (status === 'RECEIVED') summary.bookingRequests += 1;
    if (status === 'COMPLETED') summary.completedServiceJobs += 1;
    if (cancelled) summary.cancelledJobs += 1;
    if (status === 'AWAITING_QC') summary.qcPendingJobs += 1;

    if (
      CONFIRMED_SERVICE_STATUSES.includes(
        status as (typeof CONFIRMED_SERVICE_STATUSES)[number]
      )
    ) {
      summary.confirmedServiceJobs += 1;
      if (!hasPrice) summary.missingPrice += 1;
      if (hasPrice) {
        summary.serviceValueCentsLike += Number(price);
        summary.serviceValueJobCount += 1;
      }
    }

    if (
      scheduled &&
      (status === 'ASSIGNED' ||
        status === 'ON_THE_WAY' ||
        status === 'IN_PROGRESS' ||
        status === 'AWAITING_QC')
    ) {
      summary.assignedServiceJobs += 1;
    }

    if (
      (status === 'CONFIRMED' || status === 'ASSIGNED') &&
      !job.assignedCleanerId &&
      !cancelled
    ) {
      // Unassigned confirmed demand: has a service date today or future, or unscheduled.
      const day = job.preferredDate
        ? serviceDateKey(job.preferredDate) ?? job.preferredDate.slice(0, 10)
        : null;
      if (!day || day >= today) {
        summary.unassignedConfirmedDemand += 1;
      }
    }
  }

  return summary;
}

export function dayCountsFromJobs(
  jobs: Array<{ preferredDate: string | null }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    if (!job.preferredDate) continue;
    const key =
      serviceDateKey(job.preferredDate) ??
      (typeof job.preferredDate === 'string'
        ? job.preferredDate.slice(0, 10)
        : null);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function clampPageSize(raw: number | null | undefined, fallback = 50): number {
  if (!raw || Number.isNaN(raw)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(raw)));
}

export function clampPage(raw: number | null | undefined): number {
  if (!raw || Number.isNaN(raw) || raw < 1) return 1;
  return Math.floor(raw);
}
