/**
 * Job.preferredDate is a date-only business value stored in a DateTime column.
 *
 * Convention: calendar day encoded as UTC midnight (YYYY-MM-DDT00:00:00.000Z).
 * preferredTime is a separate string; Calendar overlays it with setUTCHours.
 *
 * Never format preferredDate with default local timezone — US locales shift
 * UTC midnight to the previous calendar day (e.g. Sep 15 → Sep 14 in Vermont).
 */

export type ServiceDateFormatOptions = Intl.DateTimeFormatOptions;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Parse host/admin date-only input into UTC midnight of that calendar day. */
export function parseServiceDateInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(DATE_ONLY_RE);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
}

/**
 * Format a preferredDate / service calendar day without local timezone shift.
 * Always uses timeZone: 'UTC' so 2026-09-15T00:00:00.000Z → September 15.
 */
export function formatServiceDate(
  value: string | Date | null | undefined,
  options: ServiceDateFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  if (value == null || value === '') return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    ...options,
    timeZone: 'UTC',
  });
}

/** Timezone-safe confirmed date + requested time for host/ops notifications. */
export function formatConfirmedSchedule(
  preferredDate: string | Date | null | undefined,
  preferredTime: string | null | undefined
): { dateLabel: string; timeLabel: string; combined: string } {
  const dateLabel =
    formatServiceDate(preferredDate, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) || 'As scheduled';
  const timeLabel = preferredTime?.trim() || 'As scheduled';
  return {
    dateLabel,
    timeLabel,
    combined: `${dateLabel} at ${timeLabel}`,
  };
}

/** UTC YYYY-MM-DD for comparisons / HTML date inputs. */
export function serviceDateKey(
  value: string | Date | null | undefined
): string | null {
  if (value == null || value === '') return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Operating timezone for business/service-date reasoning. */
export const BUSINESS_TIMEZONE = process.env.BILLING_TIMEZONE || 'America/New_York';

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/**
 * Calendar-day key (YYYY-MM-DD) for a service date, correct across the two
 * encodings this codebase mixes:
 *
 *   - date-only values encoded as UTC midnight (e.g. Job.preferredDate) →
 *     read the day in UTC, because converting UTC-midnight to a US timezone
 *     would shift it back onto the previous calendar day.
 *   - real wall-clock timestamps (e.g. Invoice.jobDate = completedAt) →
 *     read the day in the business timezone, because a Vermont evening clean
 *     stored in UTC would otherwise roll onto the next UTC calendar day.
 *
 * This is the timezone-safe comparison required by Incident #001 (C7): never
 * use naive UTC-day equality on a wall-clock timestamp.
 */
export function businessDateKey(
  value: string | Date | null | undefined,
  timeZone: string = BUSINESS_TIMEZONE
): string | null {
  if (value == null || value === '') return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  if (isUtcMidnight(date)) {
    return serviceDateKey(date);
  }

  // en-CA formats as YYYY-MM-DD, giving a directly comparable key.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** True when two service dates fall on the same business calendar day. */
export function isSameServiceDay(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
  timeZone: string = BUSINESS_TIMEZONE
): boolean {
  const ka = businessDateKey(a, timeZone);
  const kb = businessDateKey(b, timeZone);
  if (ka == null || kb == null) return false;
  return ka === kb;
}
