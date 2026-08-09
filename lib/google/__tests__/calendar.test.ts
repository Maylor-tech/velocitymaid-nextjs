/**
 * Tests Calendar create gate (preferredDate required for new events),
 * preferredTime clock parsing, and update-never-duplicates behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { calendarMock, jobUpdates } = vi.hoisted(() => ({
  calendarMock: {
    inserted: [] as any[],
    patched: [] as any[],
    shouldThrow: false,
  },
  jobUpdates: [] as any[],
}));

vi.mock('../../prisma', () => ({
  prisma: {
    job: {
      update: vi.fn(async ({ data }: any) => {
        jobUpdates.push(data);
        return data;
      }),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../client', () => ({
  getCalendarClient: vi.fn(() => {
    if (calendarMock.shouldThrow) {
      return {
        events: {
          insert: vi.fn(async () => {
            throw new Error('Simulated Calendar API failure');
          }),
          patch: vi.fn(async () => {
            throw new Error('Simulated Calendar API failure');
          }),
        },
      };
    }
    return {
      events: {
        insert: vi.fn(async ({ requestBody }: any) => {
          calendarMock.inserted.push(requestBody);
          return { data: { id: `event-${calendarMock.inserted.length}` } };
        }),
        patch: vi.fn(async ({ eventId, requestBody }: any) => {
          calendarMock.patched.push({ eventId, requestBody });
          return { data: { id: eventId } };
        }),
      },
    };
  }),
}));

vi.mock('../config', () => ({
  readGoogleEnvConfig: vi.fn(() => ({ operationsCalendarId: 'calendar-123' })),
  isCalendarEnabled: vi.fn(async () => true),
  recordSyncError: vi.fn(async () => {}),
}));

vi.mock('../integrationLog', () => ({
  logIntegrationEvent: vi.fn(async () => {}),
}));

import {
  upsertJobCalendarEvent,
  cancelJobCalendarEvent,
  parsePreferredClockTime,
  hasEnoughSchedulingInfo,
} from '../calendar';
import { isCalendarEnabled } from '../config';
import { logIntegrationEvent } from '../integrationLog';

const baseJob = {
  id: 'job-1',
  jobReference: 'VM-2026-0001',
  serviceType: 'DEEP_CLEAN',
  areaLabel: 'Vermont',
  preferredDate: new Date('2026-08-01T14:00:00Z'),
  preferredTime: null as string | null,
  cleanerName: null as string | null,
  calendarEventId: null as string | null,
};

describe('parsePreferredClockTime / hasEnoughSchedulingInfo', () => {
  it('parses 24h, 12h, and range starts; rejects labels', () => {
    expect(parsePreferredClockTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parsePreferredClockTime('2:00 PM')).toEqual({ hours: 14, minutes: 0 });
    expect(parsePreferredClockTime('10:00 - 12:00')).toEqual({ hours: 10, minutes: 0 });
    expect(parsePreferredClockTime('Morning')).toBeNull();
    expect(parsePreferredClockTime(null)).toBeNull();
  });

  it('requires preferredDate for enough scheduling info', () => {
    expect(hasEnoughSchedulingInfo({ preferredDate: new Date() })).toBe(true);
    expect(hasEnoughSchedulingInfo({ preferredDate: null })).toBe(false);
  });
});

describe('upsertJobCalendarEvent', () => {
  beforeEach(() => {
    calendarMock.inserted = [];
    calendarMock.patched = [];
    calendarMock.shouldThrow = false;
    jobUpdates.length = 0;
    vi.mocked(isCalendarEnabled).mockResolvedValue(true);
    vi.clearAllMocks();
  });

  it('returns null immediately when Calendar is disabled — no API calls at all', async () => {
    vi.mocked(isCalendarEnabled).mockResolvedValue(false);
    const result = await upsertJobCalendarEvent(baseJob);
    expect(result).toBeNull();
    expect(calendarMock.inserted).toHaveLength(0);
  });

  it('skips create when preferredDate is missing (fail soft / enough-info gate)', async () => {
    const result = await upsertJobCalendarEvent({ ...baseJob, preferredDate: null });
    expect(result).toBeNull();
    expect(calendarMock.inserted).toHaveLength(0);
    expect(calendarMock.patched).toHaveLength(0);
  });

  it('still patches an existing event when preferredDate is missing (never creates another)', async () => {
    const result = await upsertJobCalendarEvent({
      ...baseJob,
      preferredDate: null,
      calendarEventId: 'event-existing',
      cleanerName: 'Jane',
    });
    expect(result).toBe('event-existing');
    expect(calendarMock.inserted).toHaveLength(0);
    expect(calendarMock.patched).toHaveLength(1);
    expect(calendarMock.patched[0].eventId).toBe('event-existing');
  });

  it('never puts the exact street address in the description — area label only', async () => {
    await upsertJobCalendarEvent(baseJob);
    const description = calendarMock.inserted[0].description as string;
    expect(description).toContain('Vermont');
    expect(description).not.toMatch(/\d{1,5}\s+\w+\s+(St|Street|Ave|Avenue|Rd|Road)/i);
  });

  it('applies preferredTime onto the event start when parseable', async () => {
    await upsertJobCalendarEvent({
      ...baseJob,
      preferredDate: new Date('2026-08-01T00:00:00Z'),
      preferredTime: '10:00 AM',
    });
    expect(calendarMock.inserted[0].start.dateTime).toBe('2026-08-01T10:00:00.000Z');
  });

  it('creates one event on first sync, then patches the SAME event on subsequent syncs (idempotent)', async () => {
    const created = await upsertJobCalendarEvent(baseJob);
    expect(created).toBe('event-1');
    expect(calendarMock.inserted).toHaveLength(1);
    expect(jobUpdates).toHaveLength(1);
    expect(jobUpdates[0].calendarEventId).toBe('event-1');

    const updated = await upsertJobCalendarEvent({
      ...baseJob,
      calendarEventId: 'event-1',
      cleanerName: 'Jane Cleaner',
    });
    expect(updated).toBe('event-1');
    expect(calendarMock.inserted).toHaveLength(1);
    expect(calendarMock.patched).toHaveLength(1);
    expect(calendarMock.patched[0].requestBody.summary).toContain('Jane Cleaner');
    expect(jobUpdates.some((u) => u.calendarEventStatus === 'synced')).toBe(true);
  });

  it('logs failure and returns null (never throws) when the Calendar API errors', async () => {
    calendarMock.shouldThrow = true;
    const result = await upsertJobCalendarEvent(baseJob);
    expect(result).toBeNull();
    expect(logIntegrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', channel: 'CALENDAR' })
    );
  });
});

describe('cancelJobCalendarEvent', () => {
  beforeEach(() => {
    calendarMock.inserted = [];
    calendarMock.patched = [];
    calendarMock.shouldThrow = false;
    jobUpdates.length = 0;
    vi.mocked(isCalendarEnabled).mockResolvedValue(true);
  });

  it('is a no-op when the job has no calendarEventId', async () => {
    await cancelJobCalendarEvent({ id: 'job-1', calendarEventId: null });
    expect(calendarMock.patched).toHaveLength(0);
  });

  it('marks the event cancelled via patch rather than deleting it', async () => {
    await cancelJobCalendarEvent({ id: 'job-1', calendarEventId: 'event-1' });
    expect(calendarMock.patched).toHaveLength(1);
    expect(calendarMock.patched[0].requestBody.status).toBe('cancelled');
    expect(jobUpdates[0].calendarEventStatus).toBe('cancelled');
  });
});
