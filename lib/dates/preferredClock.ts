/**
 * Canonical scheduling-time contract for Calendar sync and service-start
 * reasoning (offer TTL, etc.).
 *
 * - Job.preferredDate is a date-only day stored as UTC midnight
 *   (YYYY-MM-DDT00:00:00.000Z).
 * - preferredTime is a free-text window ("12:00 - 15:30", "2:00 PM", "14:00")
 *   or a non-clock label ("Morning"). Clock values are Vermont / business
 *   wall times in America/New_York (EST/EDT), never UTC hours.
 * - Labels / empty preferredTime have no precise clock: Calendar uses an
 *   all-day event; resolveServiceStart returns null (no fabricated midnight).
 *   Offer TTL may still use the service calendar day for horizon banding only.
 */

import { BUSINESS_TIMEZONE } from '@/lib/dates/serviceDate';

export const SERVICE_SCHEDULE_TIMEZONE = BUSINESS_TIMEZONE;

export const DEFAULT_SERVICE_DURATION_MS = 2 * 60 * 60 * 1000;

export type PreferredClockTime = { hours: number; minutes: number };

export type PreferredTimeWindow = {
  start: PreferredClockTime;
  /** Present when preferredTime is a parseable range with a valid end. */
  end: PreferredClockTime | null;
};

function parseOneClock(raw: string): PreferredClockTime | null {
  const part = raw.trim();
  if (!part) return null;

  const ampm = part.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2], 10);
    const mer = ampm[3].toUpperCase();
    if (mer === 'PM' && hours < 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }

  const h24 = part.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const minutes = parseInt(h24[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }

  return null;
}

/**
 * Parse a clock time from preferredTime for overlay onto preferredDate.
 * Supports "14:00", "2:00 PM", and range starts like "10:00 - 12:00".
 * Returns null for labels like "Morning" / unparseable values.
 */
export function parsePreferredClockTime(
  preferredTime: string | null | undefined
): PreferredClockTime | null {
  return parsePreferredTimeWindow(preferredTime)?.start ?? null;
}

/**
 * Parse start (and optional end) from preferredTime.
 * Returns null for labels like "Morning" / unparseable values.
 */
export function parsePreferredTimeWindow(
  preferredTime: string | null | undefined
): PreferredTimeWindow | null {
  if (!preferredTime?.trim()) return null;

  const parts = preferredTime.split(/\s*[-–—]\s*/);
  const start = parseOneClock(parts[0] ?? '');
  if (!start) return null;

  const end = parts.length >= 2 ? parseOneClock(parts[1] ?? '') : null;
  return { start, end };
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function readZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0';

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  };
}

/**
 * Convert a wall-clock time on a calendar day in `timeZone` to a UTC instant.
 * Handles America/New_York EST/EDT via Intl (no fixed UTC-hour overlay).
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string = SERVICE_SCHEDULE_TIMEZONE
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

  for (let i = 0; i < 3; i++) {
    const seen = readZonedParts(new Date(utcMs), timeZone);
    const seenAsUtc = Date.UTC(
      seen.year,
      seen.month - 1,
      seen.day,
      seen.hour,
      seen.minute,
      0,
      0
    );
    const wantedAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
    const diff = wantedAsUtc - seenAsUtc;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function serviceDayUtcParts(preferredDate: Date): {
  year: number;
  month: number;
  day: number;
} {
  return {
    year: preferredDate.getUTCFullYear(),
    month: preferredDate.getUTCMonth() + 1,
    day: preferredDate.getUTCDate(),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatServiceDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Next calendar day after YYYY-MM-DD (for Google all-day exclusive end). */
export function nextServiceDateKey(serviceDateKey: string): string {
  const [y, m, d] = serviceDateKey.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return formatServiceDateKey(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate()
  );
}

function minutesOfDay(clock: PreferredClockTime): number {
  return clock.hours * 60 + clock.minutes;
}

export type ServiceWindow = {
  /**
   * Precise timed start, or null when preferredTime has no parseable clock
   * (all-day / daypart label — do not treat as midnight).
   */
  start: Date | null;
  end: Date | null;
  /** True when Calendar should use a date-only (all-day) event. */
  allDay: boolean;
  /** True when start came from a parseable preferredTime clock. */
  hasParsedClock: boolean;
  /** True when end came from a parseable range end (not the 2h default). */
  hasParsedEnd: boolean;
  /** Service calendar day YYYY-MM-DD from preferredDate (UTC-midnight convention). */
  serviceDateKey: string;
};

/**
 * Resolve the service window for Calendar + ops reasoning.
 * Single start → 2h default duration. Valid range end is respected.
 * Unparseable labels / empty time → all-day (no fabricated midnight–2am window).
 */
export function resolveServiceWindow(
  preferredDate: Date | string | null | undefined,
  preferredTime?: string | null,
  timeZone: string = SERVICE_SCHEDULE_TIMEZONE
): ServiceWindow | null {
  if (preferredDate == null || preferredDate === '') return null;
  const date =
    preferredDate instanceof Date ? preferredDate : new Date(preferredDate);
  if (Number.isNaN(date.getTime())) return null;

  const { year, month, day } = serviceDayUtcParts(date);
  const serviceDateKey = formatServiceDateKey(year, month, day);
  const parsed = parsePreferredTimeWindow(preferredTime);

  if (!parsed) {
    return {
      start: null,
      end: null,
      allDay: true,
      hasParsedClock: false,
      hasParsedEnd: false,
      serviceDateKey,
    };
  }

  const start = zonedWallTimeToUtc(
    year,
    month,
    day,
    parsed.start.hours,
    parsed.start.minutes,
    timeZone
  );

  let end: Date;
  let hasParsedEnd = false;
  if (parsed.end) {
    hasParsedEnd = true;
    let endDay = day;
    let endMonth = month;
    let endYear = year;
    if (minutesOfDay(parsed.end) <= minutesOfDay(parsed.start)) {
      const rolled = new Date(Date.UTC(year, month - 1, day + 1));
      endYear = rolled.getUTCFullYear();
      endMonth = rolled.getUTCMonth() + 1;
      endDay = rolled.getUTCDate();
    }
    end = zonedWallTimeToUtc(
      endYear,
      endMonth,
      endDay,
      parsed.end.hours,
      parsed.end.minutes,
      timeZone
    );
  } else {
    end = new Date(start.getTime() + DEFAULT_SERVICE_DURATION_MS);
  }

  return {
    start,
    end,
    allDay: false,
    hasParsedClock: true,
    hasParsedEnd,
    serviceDateKey,
  };
}

/**
 * Precise service-start instant for TTL safety cutoffs / timed ops.
 * Returns null when preferredTime is a daypart label or otherwise unparseable —
 * never fabricates midnight as a false start.
 */
export function resolveServiceStart(
  preferredDate: Date | string | null | undefined,
  preferredTime?: string | null,
  timeZone: string = SERVICE_SCHEDULE_TIMEZONE
): Date | null {
  const window = resolveServiceWindow(preferredDate, preferredTime, timeZone);
  if (!window?.hasParsedClock || !window.start) return null;
  return window.start;
}

/**
 * Hours until service for offer-TTL horizon banding.
 * Timed windows use the precise Eastern start. Daypart / empty preferredTime
 * use local midnight of the service day as a **day-level** horizon only —
 * not a claimed precise service-start (see resolveServiceStart → null).
 */
export function hoursUntilService(
  preferredDate: Date | string | null | undefined,
  preferredTime: string | null | undefined,
  now: Date,
  timeZone: string = SERVICE_SCHEDULE_TIMEZONE
): number | null {
  const window = resolveServiceWindow(preferredDate, preferredTime, timeZone);
  if (!window) return null;

  if (window.hasParsedClock && window.start) {
    return (window.start.getTime() - now.getTime()) / (60 * 60 * 1000);
  }

  const [y, m, d] = window.serviceDateKey.split('-').map(Number);
  const dayStart = zonedWallTimeToUtc(y, m, d, 0, 0, timeZone);
  return (dayStart.getTime() - now.getTime()) / (60 * 60 * 1000);
}
