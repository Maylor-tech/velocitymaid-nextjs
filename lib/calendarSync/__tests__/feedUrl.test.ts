import { describe, expect, it } from 'vitest';
import { checkFeedUrl, isAllowedFeedHost, maskFeedUrl } from '../feedUrl';

describe('checkFeedUrl', () => {
  it('accepts Airbnb and VRBO export links and detects the source', () => {
    const a = checkFeedUrl('https://www.airbnb.com/calendar/ical/123456.ics?s=abcdef');
    expect(a).toMatchObject({ ok: true, source: 'AIRBNB' });
    const v = checkFeedUrl('http://www.vrbo.com/icalendar/0a1b2c3d.ics?nonTentative');
    expect(v).toMatchObject({ ok: true, source: 'VRBO' });
    expect(v.ok && v.url.startsWith('https://')).toBe(true);
  });

  it('turns webcal:// into https://', () => {
    const r = checkFeedUrl('webcal://www.airbnb.com/calendar/ical/1.ics?s=x');
    expect(r.ok && r.url).toBe('https://www.airbnb.com/calendar/ical/1.ics?s=x');
  });

  it('refuses other hosts, look-alikes, internal addresses and credentials', () => {
    for (const bad of [
      'https://evil.example.com/cal.ics',
      'https://airbnb.com.evil.io/cal.ics',
      'https://notairbnb.com/cal.ics',
      'https://169.254.169.254/latest/meta-data',
      'http://localhost:3000/x.ics',
      'https://user:pw@www.airbnb.com/calendar/ical/1.ics',
      'https://www.airbnb.com:8443/calendar/ical/1.ics',
      'ftp://www.airbnb.com/x.ics',
      '',
      42,
    ]) {
      expect(checkFeedUrl(bad).ok, String(bad)).toBe(false);
    }
  });

  it('checks redirect targets the same way', () => {
    expect(isAllowedFeedHost('https://ical.vrbo.com/x.ics')).toBe(true);
    expect(isAllowedFeedHost('https://attacker.test/x.ics')).toBe(false);
    expect(isAllowedFeedHost('http://www.vrbo.com/x.ics')).toBe(false);
  });
});

describe('maskFeedUrl', () => {
  it('never returns the secret query string', () => {
    const masked = maskFeedUrl('https://www.airbnb.com/calendar/ical/123456789012345.ics?s=SECRET');
    expect(masked).not.toContain('SECRET');
    expect(masked).toContain('airbnb.com');
  });
});
