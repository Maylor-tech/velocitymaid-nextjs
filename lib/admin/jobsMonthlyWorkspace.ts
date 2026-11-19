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
  serviceDayRelativeToEastern,
} from '@/lib/dates/serviceDate';
import { parsePreferredClockTime } from '@/lib/dates/preferredClock';

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
  /**
   * Open confirmed bookings in scope (CONFIRMED → AWAITING_QC).
   * Excludes RECEIVED requests, COMPLETED, and cancelled.
   */
  confirmedBookings: number;
  /** Active scheduled jobs with a valid assignedCleanerId. */
  assignedJobs: number;
  /**
   * Future/today confirmed demand needing a cleaner (or ASSIGNED without cleaner).
   * Excludes RECEIVED and past-incomplete.
   */
  needsCleaner: number;
  /** Sum of totalPrice/quotedTotal for confirmed+completed priced jobs. */
  confirmedServiceValue: number;
  confirmedServiceValueJobCount: number;
  bookingRequests: number;
  confirmedServiceJobs: number;
  assignedServiceJobs: number;
  completedServiceJobs: number;
  cancelledJobs: number;
  unassignedConfirmedDemand: number;
  qcPendingJobs: number;
  pastIncompleteJobs: number;
  missingPrice: number;
  unscheduledJobs: number;
  /** @deprecated alias — use confirmedServiceValue */
  serviceValueCentsLike: number;
  serviceValueJobCount: number;
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

/** Minutes from midnight for clock-parseable times; null if unknown/unparseable. */
export function serviceTimeSortMinutes(
  time: string | null | undefined
): number | null {
  const clock = parsePreferredClockTime(time);
  if (!clock) return null;
  return clock.hours * 60 + clock.minutes;
}

/** Deterministic: service date ASC, clock-normalized time ASC (unknown last), id ASC. */
export function sortJobsDeterministic<T extends MonthlyJobSortInput>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const da =
      serviceDateKey(a.preferredDate) ||
      (a.preferredDate ? a.preferredDate.slice(0, 10) : '9999-99-99');
    const db =
      serviceDateKey(b.preferredDate) ||
      (b.preferredDate ? b.preferredDate.slice(0, 10) : '9999-99-99');
    if (da !== db) return da < db ? -1 : 1;

    const ma = serviceTimeSortMinutes(a.preferredTime);
    const mb = serviceTimeSortMinutes(b.preferredTime);
    if (ma == null && mb != null) return 1;
    if (ma != null && mb == null) return -1;
    if (ma != null && mb != null && ma !== mb) return ma - mb;

    // Same clock (or both unknown): stable secondary by raw string then id
    const ta = normalizeServiceTime(a.preferredTime);
    const tb = normalizeServiceTime(b.preferredTime);
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
    confirmedBookings: 0,
    assignedJobs: 0,
    needsCleaner: 0,
    confirmedServiceValue: 0,
    confirmedServiceValueJobCount: 0,
    bookingRequests: 0,
    confirmedServiceJobs: 0,
    assignedServiceJobs: 0,
    completedServiceJobs: 0,
    cancelledJobs: 0,
    unassignedConfirmedDemand: 0,
    qcPendingJobs: 0,
    pastIncompleteJobs: 0,
    missingPrice: 0,
    unscheduledJobs: 0,
    serviceValueCentsLike: 0,
    serviceValueJobCount: 0,
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
    const hasCleaner = Boolean(job.assignedCleanerId);
    const day = job.preferredDate
      ? serviceDateKey(job.preferredDate) ?? job.preferredDate.slice(0, 10)
      : null;
    const isFutureOrToday = !day || day >= today;
    const isPast = Boolean(day && day < today);

    if (!job.preferredDate) summary.unscheduledJobs += 1;
    if (status === 'RECEIVED') summary.bookingRequests += 1;
    if (status === 'COMPLETED') summary.completedServiceJobs += 1;
    if (cancelled) summary.cancelledJobs += 1;
    if (status === 'AWAITING_QC') summary.qcPendingJobs += 1;

    if (
      !cancelled &&
      status !== 'RECEIVED' &&
      status !== 'COMPLETED' &&
      isPast &&
      day
    ) {
      summary.pastIncompleteJobs += 1;
    }

    // Open confirmed bookings (excludes completed + requests + cancelled)
    if (ACTIVE_SCHEDULED_STATUSES.includes(status as (typeof ACTIVE_SCHEDULED_STATUSES)[number])) {
      summary.confirmedBookings += 1;
    }

    if (
      CONFIRMED_SERVICE_STATUSES.includes(
        status as (typeof CONFIRMED_SERVICE_STATUSES)[number]
      )
    ) {
      summary.confirmedServiceJobs += 1;
      if (!hasPrice) summary.missingPrice += 1;
      if (hasPrice) {
        summary.confirmedServiceValue += Number(price);
        summary.confirmedServiceValueJobCount += 1;
      }
    }

    // Assigned jobs: active scheduled with a real cleaner id
    if (
      ACTIVE_SCHEDULED_STATUSES.includes(status as (typeof ACTIVE_SCHEDULED_STATUSES)[number]) &&
      hasCleaner
    ) {
      summary.assignedJobs += 1;
      summary.assignedServiceJobs += 1;
    }

    // Needs cleaner: future/today confirmed demand without cleaner (not RECEIVED)
    if (
      !cancelled &&
      status !== 'RECEIVED' &&
      status !== 'COMPLETED' &&
      !hasCleaner &&
      isFutureOrToday &&
      (status === 'CONFIRMED' || status === 'ASSIGNED')
    ) {
      summary.needsCleaner += 1;
      summary.unassignedConfirmedDemand += 1;
    }
  }

  summary.serviceValueCentsLike = summary.confirmedServiceValue;
  summary.serviceValueJobCount = summary.confirmedServiceValueJobCount;
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

/** Sunday–Saturday week grid containing `anchorKey` (YYYY-MM-DD). */
export function buildWeekCalendarGrid(
  anchorKey: string,
  now: Date = new Date()
): CalendarCell[] {
  const day = isDayKey(anchorKey) ? anchorKey : easternDateKey(now);
  const parsed = parseServiceDateInput(day);
  if (!parsed) return [];
  const dow = parsed.getUTCDay(); // 0=Sun
  const startKey = addCalendarDayKey(day, -dow);
  const todayKey = easternDateKey(now);
  const monthKey = day.slice(0, 7);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 7; i += 1) {
    const key = addCalendarDayKey(startKey, i);
    cells.push({
      key,
      dayOfMonth: Number(key.slice(8, 10)),
      inMonth: key.startsWith(monthKey),
      isToday: key === todayKey,
    });
  }
  return cells;
}

export type WeekJobLabelInput = {
  preferredDate: string | null;
  property?: { name?: string | null; guestDisplayName?: string | null } | null;
  customerName?: string | null;
  serviceType?: string | null;
};

function weekJobChipLabel(job: WeekJobLabelInput): string {
  return (
    job.property?.name ||
    job.property?.guestDisplayName ||
    job.customerName ||
    job.serviceType ||
    'Job'
  );
}

/** All job chip labels per day (full labels, no truncation). */
export function weekDayJobChipsFromJobs(
  jobs: WeekJobLabelInput[]
): Record<string, string[]> {
  const byDay: Record<string, string[]> = {};
  for (const job of jobs) {
    if (!job.preferredDate) continue;
    const key =
      serviceDateKey(job.preferredDate) ??
      (typeof job.preferredDate === 'string'
        ? job.preferredDate.slice(0, 10)
        : null);
    if (!key) continue;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(weekJobChipLabel(job));
  }
  return byDay;
}

/**
 * Visible chips for a calendar day: up to `maxVisible` property labels,
 * then a "+N more" overflow chip. Never uses "×N" on the first label.
 */
export function weekDayVisibleChips(
  chips: string[],
  maxVisible = 2
): { shown: string[]; moreLabel: string | null } {
  if (chips.length <= maxVisible) {
    return { shown: chips, moreLabel: null };
  }
  const overflow = chips.length - maxVisible;
  return {
    shown: chips.slice(0, maxVisible),
    moreLabel: `+${overflow} more`,
  };
}

/**
 * @deprecated Prefer weekDayJobChipsFromJobs + weekDayVisibleChips.
 * Kept for single-label call sites; multi-job days return the first label only.
 */
export function weekDayLabelsFromJobs(
  jobs: WeekJobLabelInput[]
): Record<string, string> {
  const byDay = weekDayJobChipsFromJobs(jobs);
  const out: Record<string, string> = {};
  for (const [key, labels] of Object.entries(byDay)) {
    out[key] = labels[0];
  }
  return out;
}

/** Title fragment like "week of the 15th" for the week starting at startKey. */
export function weekOfLabel(startKey: string): string {
  if (!isDayKey(startKey)) return 'this week';
  const day = Number(startKey.slice(8, 10));
  const j = day % 10;
  const k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';
  return `week of the ${day}${suffix}`;
}

export function clampPageSize(raw: number | null | undefined, fallback = 50): number {
  if (!raw || Number.isNaN(raw)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(raw)));
}

export function clampPage(raw: number | null | undefined): number {
  if (!raw || Number.isNaN(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

/** Fields the monthly jobs payload must carry for the Reports and invoices panel. */
export const monthlyJobReportInvoiceSelect = {
  CompletionReport: {
    select: { status: true, sentAt: true },
  },
  Invoice: {
    select: { status: true, sentAt: true },
  },
} as const;

export type MonthlyReportSend = {
  status: string;
  sentAt: string | null;
};

export type ReportInvoiceJob = {
  id: string;
  status: string;
  preferredDate: string | null;
  completionReport: MonthlyReportSend | null;
  invoice: { status: string; sentAt: string | null } | null;
};

export type ReportInvoiceDescription = {
  reportSentAt: string | null;
  invoiceSentAt: string | null;
  reportLabel: string;
  invoiceLabel: string;
  warn: boolean;
};

function parseSentInstant(value: string | null | undefined): string | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

/** Eastern clock time. Invalid or missing values stay blank so the UI can say the item was not sent. */
export function formatDeskSentAt(value: string | null | undefined): string | null {
  const iso = parseSentInstant(value);
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(/\u202f/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function monthlyReportInvoiceFields(row: {
  CompletionReport: { status: string; sentAt: Date | null } | null;
  Invoice: { status: string; sentAt: Date | null } | null;
}): Pick<ReportInvoiceJob, 'completionReport' | 'invoice'> {
  return {
    completionReport: row.CompletionReport
      ? {
          status: row.CompletionReport.status,
          sentAt: row.CompletionReport.sentAt?.toISOString() ?? null,
        }
      : null,
    invoice: row.Invoice
      ? {
          status: row.Invoice.status,
          sentAt: row.Invoice.sentAt?.toISOString() ?? null,
        }
      : null,
  };
}

/**
 * Report is sent only when sentAt is a real instant.
 * Status alone never supplies a time.
 */
export function describeReportInvoice(
  job: Pick<ReportInvoiceJob, 'completionReport' | 'invoice'>
): ReportInvoiceDescription {
  const reportSentAt = parseSentInstant(job.completionReport?.sentAt);
  const invoiceSentAt = parseSentInstant(job.invoice?.sentAt);
  const reportClock = formatDeskSentAt(reportSentAt);
  const invoiceClock = formatDeskSentAt(invoiceSentAt);
  const warn =
    invoiceSentAt != null &&
    (reportSentAt == null ||
      new Date(reportSentAt).getTime() > new Date(invoiceSentAt).getTime());

  return {
    reportSentAt,
    invoiceSentAt,
    reportLabel: reportClock ? `Report sent ${reportClock}` : 'Report not sent',
    invoiceLabel: invoiceClock ? `Invoice sent ${invoiceClock}` : 'Invoice not sent',
    warn,
  };
}

function reportInvoiceRank(described: ReportInvoiceDescription): number {
  if (described.warn) return 0;
  if (!described.reportSentAt) return 1;
  return 2;
}

/**
 * Completed jobs whose service date is today or earlier in Eastern time.
 * A missing service date is not treated as today.
 */
export function isReportInvoiceListed(
  job: Pick<ReportInvoiceJob, 'status' | 'preferredDate'>,
  asOf: Date = new Date()
): boolean {
  if (job.status !== 'COMPLETED') return false;
  const relation = serviceDayRelativeToEastern(job.preferredDate, asOf);
  return relation === 'today' || relation === 'past';
}

/** Listed jobs only. Warnings first, then reports not sent, then report-before-invoice. */
export function orderCompletedReportInvoiceJobs<T extends ReportInvoiceJob>(
  jobs: T[],
  asOf: Date = new Date()
): T[] {
  return jobs
    .filter((job) => isReportInvoiceListed(job, asOf))
    .map((job) => ({ job, described: describeReportInvoice(job) }))
    .sort((a, b) => {
      const rank = reportInvoiceRank(a.described) - reportInvoiceRank(b.described);
      if (rank !== 0) return rank;
      const dateA = a.job.preferredDate ?? '9999-99-99';
      const dateB = b.job.preferredDate ?? '9999-99-99';
      if (dateA !== dateB) return dateA < dateB ? -1 : 1;
      if (a.job.id === b.job.id) return 0;
      return a.job.id < b.job.id ? -1 : 1;
    })
    .map((entry) => entry.job);
}
