import { describe, expect, it } from 'vitest';
import { icsDateToDay, isReservation, parseIcs } from '../ics';

const AIRBNB = [
  'BEGIN:VCALENDAR',
  'PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 1.0//EN',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261220',
  'DTSTART;VALUE=DATE:20261216',
  'UID:1418fb94e984-a1b2c3@airbnb.com',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC\\nPhone',
  '  Number (Last 4 Digits): 1234',
  'SUMMARY:Reserved',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261230',
  'DTSTART;VALUE=DATE:20261226',
  'UID:7f3e-blocked@airbnb.com',
  'SUMMARY:Airbnb (Not available)',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const VRBO = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:4a6d-booking',
  'DTSTAMP:20261120T120000Z',
  'DTSTART;VALUE=DATE:20270102',
  'DTEND;VALUE=DATE:20270105',
  'SUMMARY:Reserved - Alex',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:4a6d-owner',
  'DTSTART:20270110T160000Z',
  'DTEND:20270112T100000Z',
  'SUMMARY:Blocked',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n');

describe('parseIcs', () => {
  it('reads Airbnb all-day stays and unfolds long lines', () => {
    const events = parseIcs(AIRBNB);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      uid: '1418fb94e984-a1b2c3@airbnb.com',
      start: '2026-12-16',
      end: '2026-12-20',
      summary: 'Reserved',
    });
  });

  it('reads VRBO stays and timed values by calendar day', () => {
    const events = parseIcs(VRBO);
    expect(events.map((e) => [e.start, e.end])).toEqual([
      ['2027-01-02', '2027-01-05'],
      ['2027-01-10', '2027-01-12'],
    ]);
  });

  it('skips events with no UID or an end before start', () => {
    const bad = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261210\nDTEND;VALUE=DATE:20261212\nEND:VEVENT\nBEGIN:VEVENT\nUID:x\nDTSTART;VALUE=DATE:20261212\nDTEND;VALUE=DATE:20261210\nEND:VEVENT\nEND:VCALENDAR';
    expect(parseIcs(bad)).toEqual([]);
  });

  it('rejects impossible dates', () => {
    expect(icsDateToDay('20261340')).toBeNull();
    expect(icsDateToDay('20261205T100000Z')).toBe('2026-12-05');
  });
});

describe('isReservation', () => {
  it('keeps guest stays and drops platform / owner blocks', () => {
    const [stay, airbnbBlock] = parseIcs(AIRBNB);
    const [vrboStay, vrboBlock] = parseIcs(VRBO);
    expect(isReservation(stay)).toBe(true);
    expect(isReservation(vrboStay)).toBe(true);
    expect(isReservation(airbnbBlock)).toBe(false);
    expect(isReservation(vrboBlock)).toBe(false);
  });

  it('drops cancelled events', () => {
    expect(
      isReservation({ uid: 'a', start: '2026-12-01', end: '2026-12-03', summary: 'Reserved', status: 'CANCELLED' })
    ).toBe(false);
  });
});
