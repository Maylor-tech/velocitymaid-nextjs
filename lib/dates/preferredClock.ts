/**
 * Parse a clock time from preferredTime for overlay onto preferredDate.
 * Supports "14:00", "2:00 PM", and range starts like "10:00 - 12:00".
 * Returns null for labels like "Morning" / unparseable values.
 */
export function parsePreferredClockTime(
  preferredTime: string | null | undefined
): { hours: number; minutes: number } | null {
  if (!preferredTime?.trim()) return null;
  const startPart = preferredTime.split('-')[0].trim();
  const ampm = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2], 10);
    const mer = ampm[3].toUpperCase();
    if (mer === 'PM' && hours < 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }
  const h24 = startPart.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const minutes = parseInt(h24[2], 10);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }
  return null;
}

/**
 * Service start instant for TTL / ops reasoning.
 * preferredDate is UTC-midnight of the calendar day; clock overlays via UTC hours
 * (same convention as Calendar event bounds).
 */
export function resolveServiceStart(
  preferredDate: Date | string | null | undefined,
  preferredTime?: string | null
): Date | null {
  if (preferredDate == null || preferredDate === '') return null;
  const date = preferredDate instanceof Date ? preferredDate : new Date(preferredDate);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  const clock = parsePreferredClockTime(preferredTime);
  if (clock) {
    start.setUTCHours(clock.hours, clock.minutes, 0, 0);
  } else {
    start.setUTCHours(0, 0, 0, 0);
  }
  return start;
}

export function hoursUntilService(
  preferredDate: Date | string | null | undefined,
  preferredTime: string | null | undefined,
  now: Date
): number | null {
  const start = resolveServiceStart(preferredDate, preferredTime);
  if (!start) return null;
  return (start.getTime() - now.getTime()) / (60 * 60 * 1000);
}
