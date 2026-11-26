import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;
const db: { feeds: Row[]; events: Row[]; jobs: Row[] } = { feeds: [], events: [], jobs: [] };
const notifications: Row[] = [];
let refSeq = 0;

vi.mock('@/lib/billing/numbering', () => ({ nextVmReference: async () => `VM-2026-${String(++refSeq).padStart(4, '0')}` }));
vi.mock('@/lib/google/jobGoogleSync', () => ({ awaitJobGoogleSync: async () => undefined }));
vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  adminNotificationHelpers: { adminJobLink: (id: string) => `/admin/jobs/${id}` },
  createAdminNotification: async (n: Row) => {
    notifications.push(n);
    return { ok: true, created: true, id: `n${notifications.length}` };
  },
}));

const sameDay = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    propertyCalendarFeed: {
      findUnique: async ({ where }: Row) => {
        const f = db.feeds.find((x) => x.id === where.id);
        return f ? { ...f, Events: db.events.filter((e) => e.feedId === f.id) } : null;
      },
      update: async ({ where, data }: Row) => Object.assign(db.feeds.find((x) => x.id === where.id)!, data),
      findMany: async () => db.feeds.filter((f) => f.active).map((f) => ({ id: f.id })),
    },
    calendarFeedEvent: {
      create: async ({ data }: Row) => {
        if (db.events.some((e) => e.feedId === data.feedId && e.uid === data.uid)) throw new Error('P2002');
        const row = { id: `ev${db.events.length + 1}`, status: 'ACTIVE', jobId: null, ...data };
        db.events.push(row);
        return row;
      },
      update: async ({ where, data }: Row) => Object.assign(db.events.find((e) => e.id === where.id)!, data),
      updateMany: async ({ where, data }: Row) => {
        const rows = db.events.filter((e) => where.id.in.includes(e.id));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      },
    },
    job: {
      findFirst: async ({ where }: Row) =>
        db.jobs.find(
          (j) => j.propertyId === where.propertyId && sameDay(j.preferredDate, where.preferredDate) && where.status.in.includes(j.status)
        ) ?? null,
      findUnique: async ({ where }: Row) => db.jobs.find((j) => j.id === where.id) ?? null,
      findMany: async ({ where }: Row) =>
        db.jobs.filter(
          (j) =>
            j.propertyId === where.propertyId &&
            where.status.in.includes(j.status) &&
            j.preferredDate >= where.preferredDate.gte &&
            j.preferredDate <= where.preferredDate.lte
        ),
      create: async ({ data }: Row) => {
        const row = { ...data, propertyId: data.Property.connect.id };
        db.jobs.push(row);
        return row;
      },
      update: async ({ where, data }: Row) => Object.assign(db.jobs.find((j) => j.id === where.id)!, data),
    },
  },
}));

import { syncCalendarFeed } from '../syncFeed';

const ics = (events: Array<[string, string, string, string?]>) =>
  [
    'BEGIN:VCALENDAR',
    ...events.flatMap(([uid, s, e, summary = 'Reserved']) => [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${s.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${e.replace(/-/g, '')}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].join('\r\n');

const fetchReturning = (body: string, status = 200) =>
  (async () => new Response(body, { status })) as unknown as typeof fetch;

const NOW = new Date('2026-12-01T15:00:00Z');

beforeEach(() => {
  db.feeds = [
    {
      id: 'feed1',
      propertyId: 'prop1',
      source: 'VRBO',
      url: 'https://www.vrbo.com/icalendar/abc.ics',
      active: true,
      lastStatus: null,
      Property: {
        id: 'prop1',
        name: 'Chipman Park',
        address: '198 Chipman Park',
        city: 'Middlebury',
        billingPolicy: null,
        standardCheckoutTime: '10:00 AM',
        standardCheckinTime: '4:00 PM',
        Customer: {
          id: 'cust1',
          firstName: 'Ray',
          lastName: 'H',
          email: 'ray@example.com',
          branchId: 'vt',
          billingPolicy: 'INVOICE_AFTER_SERVICE',
          Branch: { slug: 'vermont' },
        },
      },
    },
  ];
  db.events = [];
  db.jobs = [];
  notifications.length = 0;
  refSeq = 0;
});

describe('syncCalendarFeed', () => {
  it('creates one RECEIVED turnover request per upcoming checkout, with same-day note', async () => {
    const feed = ics([
      ['s1', '2026-12-04', '2026-12-07'],
      ['s2', '2026-12-07', '2026-12-10'],
      ['owner', '2026-12-12', '2026-12-14', 'Blocked'],
    ]);
    const r = await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning(feed) });
    expect(r).toMatchObject({ ok: true, created: 2 });
    expect(db.jobs).toHaveLength(2);
    const first = db.jobs[0];
    expect(first).toMatchObject({ status: 'RECEIVED', paymentStatus: 'PENDING', serviceType: 'Vacation Rental Turnover' });
    expect(first.preferredDate.toISOString()).toBe('2026-12-07T00:00:00.000Z');
    expect(first.guestCheckInDate.toISOString()).toBe('2026-12-07T00:00:00.000Z');
    expect(first.internalNotes).toContain('Same-day turnover: Yes');
    expect(first.internalNotes).toContain('Check-in deadline: 4:00 PM');
    expect(notifications.filter((n) => n.type === 'CALENDAR_SYNC_TURNOVER')).toHaveLength(2);
    expect(db.feeds[0].lastStatus).toBe('OK');
  });

  it('does not create duplicates when run again', async () => {
    const feed = ics([['s1', '2026-12-04', '2026-12-07']]);
    await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning(feed) });
    const again = await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning(feed) });
    expect(again).toMatchObject({ ok: true, created: 0, unchanged: 1 });
    expect(db.jobs).toHaveLength(1);
  });

  it('links to a job the host already requested for that date instead of doubling it', async () => {
    db.jobs.push({ id: 'manual', propertyId: 'prop1', preferredDate: new Date('2026-12-07T00:00:00Z'), status: 'CONFIRMED' });
    const r = await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-04', '2026-12-07']])),
    });
    expect(r).toMatchObject({ created: 0, linked: 1 });
    expect(db.jobs).toHaveLength(1);
    expect(db.events[0].jobId).toBe('manual');
  });

  it('links a stay one day off an existing clean and warns, instead of adding a second clean', async () => {
    db.jobs.push({ id: 'dec30', propertyId: 'prop1', preferredDate: new Date('2026-12-30T00:00:00Z'), status: 'RECEIVED' });
    const r = await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-26', '2026-12-31'], ['s2', '2026-12-31', '2027-01-03']])),
    });
    expect(r).toMatchObject({ created: 1, linked: 1 });
    expect(db.events.find((e) => e.uid === 's1').jobId).toBe('dec30');
    expect(db.jobs.map((j) => j.preferredDate.toISOString().slice(0, 10)).sort()).toEqual(['2026-12-30', '2027-01-03']);
    expect(notifications.some((n) => n.type === 'CALENDAR_SYNC_CHANGE' && n.severity === 'WARNING')).toBe(true);
  });

  it('still creates a separate clean when another stay explains the nearby clean', async () => {
    db.jobs.push({ id: 'dec30', propertyId: 'prop1', preferredDate: new Date('2026-12-30T00:00:00Z'), status: 'RECEIVED' });
    const r = await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['a', '2026-12-27', '2026-12-30'], ['b', '2026-12-30', '2026-12-31']])),
    });
    expect(r).toMatchObject({ created: 1, linked: 1 });
    expect(db.jobs).toHaveLength(2);
  });

  it('moves an unconfirmed request, but only alerts on a confirmed one', async () => {
    await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-04', '2026-12-07'], ['s2', '2026-12-15', '2026-12-18']])),
    });
    db.jobs[1].status = 'ASSIGNED';
    await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-04', '2026-12-08'], ['s2', '2026-12-15', '2026-12-19']])),
    });
    expect(db.jobs[0].preferredDate.toISOString()).toBe('2026-12-08T00:00:00.000Z');
    expect(db.jobs[1].preferredDate.toISOString()).toBe('2026-12-18T00:00:00.000Z');
    const changes = notifications.filter((n) => n.type === 'CALENDAR_SYNC_CHANGE');
    expect(changes.map((n) => n.severity)).toEqual(['INFO', 'WARNING']);
  });

  it('flags a removed stay without cancelling the job', async () => {
    await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-04', '2026-12-07'], ['s2', '2026-12-15', '2026-12-18']])),
    });
    const r = await syncCalendarFeed('feed1', {
      now: NOW,
      fetchImpl: fetchReturning(ics([['s1', '2026-12-04', '2026-12-07']])),
    });
    expect(r.removed).toBe(1);
    expect(db.jobs.every((j) => j.status === 'RECEIVED')).toBe(true);
    expect(db.events.find((e) => e.uid === 's2')!.status).toBe('CANCELLED');
    expect(notifications.some((n) => n.type === 'CALENDAR_SYNC_CHANGE' && n.severity === 'WARNING')).toBe(true);
  });

  it('records a failure once and raises a single alert', async () => {
    const r1 = await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning('nope', 404) });
    const r2 = await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning('nope', 404) });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
    expect(db.feeds[0].lastStatus).toBe('ERROR');
    expect(notifications.filter((n) => n.type === 'CALENDAR_SYNC_ERROR')).toHaveLength(1);
  });

  it('refuses a response that is not a calendar', async () => {
    const r = await syncCalendarFeed('feed1', { now: NOW, fetchImpl: fetchReturning('<html>login</html>') });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/did not return a calendar/);
    expect(db.jobs).toHaveLength(0);
  });
});
