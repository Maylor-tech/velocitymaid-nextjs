/**
 * Helpers for daily ops summary: branch timezone "now" and date bounds in UTC.
 */

/**
 * Returns true if the current time in the given timezone is within the 6:30 PM window
 * (18:25–18:35 to allow cron running every 10–15 min).
 */
export function is630PMInTimezone(timezone: string): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return hour === 18 && minute >= 25 && minute <= 35;
}

/**
 * Get today's date string (YYYY-MM-DD) in branch timezone.
 */
export function getTodayDateStringInTimezone(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Start of today in branch timezone as UTC Date.
 * Uses noon UTC on that calendar day to resolve DST-safe offset.
 */
export function getStartOfTodayUTC(timezone: string): Date {
  const todayStr = getTodayDateStringInTimezone(timezone);
  const [y, m, d] = todayStr.split('-').map(Number);
  const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(noonUTC);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  const offsetMinutes = match
    ? (match[1] === '+' ? 1 : -1) *
      (parseInt(match[2], 10) * 60 + parseInt(match[3] || '0', 10))
    : 0;
  const offsetMs = offsetMinutes * 60 * 1000;
  return new Date(Date.UTC(y, m - 1, d) - offsetMs);
}

/**
 * Start of tomorrow in branch timezone as UTC Date.
 */
export function getStartOfTomorrowUTC(timezone: string): Date {
  const startOfToday = getStartOfTodayUTC(timezone);
  return new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Start of previous week (Monday 00:00) in branch timezone as UTC Date.
 * When run on Monday 8 AM, "previous week" = last Mon 00:00.
 */
export function getPreviousWeekStartUTC(timezone: string): Date {
  const startOfToday = getStartOfTodayUTC(timezone);
  return new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
}

/**
 * End of previous week (Sunday 23:59:59.999) in branch timezone as UTC Date.
 */
export function getPreviousWeekEndUTC(timezone: string): Date {
  const start = getPreviousWeekStartUTC(timezone);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

/**
 * Returns true if the current time in the given timezone is Monday 8:00 AM
 * (7:55–8:15 to allow cron running every 15–30 min).
 */
export function isMonday8AMInTimezone(timezone: string): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return (
    weekday === 'Mon' &&
    hour === 8 &&
    minute >= 0 &&
    minute <= 15
  );
}

/**
 * Format previous week range for display (e.g. "Feb 3–9, 2026").
 */
export function getPreviousWeekRangeLabel(timezone: string): string {
  const start = getPreviousWeekStartUTC(timezone);
  const end = getPreviousWeekEndUTC(timezone);
  const startStr = start.toLocaleDateString('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}
