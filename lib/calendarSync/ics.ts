/**
 * Minimal iCalendar (RFC 5545) reader for booking-platform export feeds
 * (Airbnb, VRBO, Booking.com, channel managers). Only VEVENT UID, DTSTART,
 * DTEND, SUMMARY and STATUS are read. Guest details are never stored.
 */

export type IcsEvent = {
  uid: string;
  /** Check-in day, as YYYY-MM-DD. */
  start: string;
  /** Check-out day, as YYYY-MM-DD (DTEND of an all-day stay). */
  end: string;
  summary: string;
  status: string | null;
};

/** Undo RFC 5545 line folding (CRLF followed by a space or tab). */
function unfold(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

/**
 * DATE (20261220) or DATE-TIME (20261220T150000Z / 20261220T150000).
 * Returns the calendar day only. Booking feeds use all-day dates; a timed
 * value keeps its written day (no timezone shift) so checkout stays put.
 */
export function icsDateToDay(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = Number(mo);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${mo}-${d}`;
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

export function parseIcs(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const raw of unfold(text)) {
    const line = raw.trimEnd();
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) {
        const start = current.DTSTART ? icsDateToDay(current.DTSTART) : null;
        const end = current.DTEND ? icsDateToDay(current.DTEND) : null;
        const uid = (current.UID || '').trim();
        if (uid && start && end && end >= start) {
          events.push({
            uid: uid.slice(0, 500),
            start,
            end,
            summary: unescapeText(current.SUMMARY || '').slice(0, 200),
            status: current.STATUS ? current.STATUS.trim().toUpperCase() : null,
          });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    // Property name before any ;PARAM=...
    const name = line.slice(0, colon).split(';')[0].toUpperCase();
    if (['UID', 'DTSTART', 'DTEND', 'SUMMARY', 'STATUS'].includes(name)) {
      current[name] = line.slice(colon + 1);
    }
  }
  return events;
}

/**
 * True for a guest stay. Owner blocks and "not available" holds are skipped:
 * Airbnb uses "Airbnb (Not available)", VRBO "Blocked".
 */
export function isReservation(event: IcsEvent): boolean {
  if (event.status === 'CANCELLED') return false;
  const s = event.summary.toLowerCase();
  if (/not available|unavailable|blocked|owner (stay|block|hold)|maintenance/.test(s)) {
    return false;
  }
  return true;
}
