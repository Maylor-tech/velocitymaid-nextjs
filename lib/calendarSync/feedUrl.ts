/**
 * Booking-calendar link checks. The link is fetched by our server, so only
 * known booking-platform hosts are allowed (no arbitrary URLs, no internal
 * addresses). The link is a private capability: show only a masked form.
 */

export type CalendarSource = 'AIRBNB' | 'VRBO' | 'BOOKING' | 'OTHER';

/** Host suffixes we will fetch from. */
const ALLOWED_HOST_SUFFIXES: Array<{ suffix: string; source: CalendarSource }> = [
  { suffix: 'airbnb.com', source: 'AIRBNB' },
  { suffix: 'airbnb.ca', source: 'AIRBNB' },
  { suffix: 'airbnb.co.uk', source: 'AIRBNB' },
  { suffix: 'vrbo.com', source: 'VRBO' },
  { suffix: 'homeaway.com', source: 'VRBO' },
  { suffix: 'booking.com', source: 'BOOKING' },
  { suffix: 'hostaway.com', source: 'OTHER' },
  { suffix: 'guesty.com', source: 'OTHER' },
  { suffix: 'ownerrez.com', source: 'OTHER' },
  { suffix: 'lodgify.com', source: 'OTHER' },
  { suffix: 'hospitable.com', source: 'OTHER' },
  { suffix: 'tripadvisor.com', source: 'OTHER' },
  { suffix: 'calendar.google.com', source: 'OTHER' },
];

function matchHost(hostname: string): CalendarSource | null {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  for (const { suffix, source } of ALLOWED_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return source;
  }
  return null;
}

export type FeedUrlCheck =
  | { ok: true; url: string; source: CalendarSource }
  | { ok: false; error: string };

export function checkFeedUrl(input: unknown): FeedUrlCheck {
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: 'Paste the calendar export link from your listing.' };
  }
  let raw = input.trim();
  if (raw.startsWith('webcal://')) raw = `https://${raw.slice('webcal://'.length)}`;
  if (raw.length > 2000) return { ok: false, error: 'That link is too long.' };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'That does not look like a link.' };
  }
  if (parsed.protocol === 'http:') parsed.protocol = 'https:';
  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'The link must start with https://' };
  }
  if (parsed.username || parsed.password || parsed.port) {
    return { ok: false, error: 'That link is not a booking-calendar export link.' };
  }
  const source = matchHost(parsed.hostname);
  if (!source) {
    return {
      ok: false,
      error:
        'Use the calendar export (iCal) link from Airbnb, VRBO, Booking.com or your channel manager.',
    };
  }
  return { ok: true, url: parsed.toString(), source };
}

/** Same check, used again after redirects. */
export function isAllowedFeedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && matchHost(parsed.hostname) !== null;
  } catch {
    return false;
  }
}

/** e.g. "airbnb.com/…/1234.ics" — enough to recognise, not enough to reuse. */
export function maskFeedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const last = parsed.pathname.split('/').filter(Boolean).pop() || '';
    const tail = last.length > 12 ? `…${last.slice(-8)}` : last;
    return `${host}/…/${tail}`;
  } catch {
    return 'calendar link';
  }
}

export const SOURCE_LABELS: Record<CalendarSource, string> = {
  AIRBNB: 'Airbnb',
  VRBO: 'VRBO',
  BOOKING: 'Booking.com',
  OTHER: 'Booking calendar',
};
