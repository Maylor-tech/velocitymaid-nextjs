/**
 * Tests upsertJobCalendarEvent()'s idempotency (create once, then always
 * patch the same event via the stored calendarEventId) and
 * cancelJobCalendarEvent() marking the event cancelled rather than
 * deleting it. Mocks the Google API client entirely; makes no real calls.
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

import { upsertJobCalendarEvent, cancelJobCalendarEvent } from '../calendar';
import { isCalendarEnabled } from '../config';
import { logIntegrationEvent } from '../integrationLog';

const baseJob = {
  id: 'job-1',
  jobReference: 'VM-2026-0001',
  serviceType: 'DEEP_CLEAN',
  areaLabel: 'Vermont',
  preferredDate: new Date('2026-08-01T14:00:00Z'),
  cleanerName: null as string | null,
  calendarEventId: null as string | null,
};

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

  it('never puts the exact street address in the description — area label only', async () => {
    await upsertJobCalendarEvent(baseJob);
    const description = calendarMock.inserted[0].description as string;
    expect(description).toContain('Vermont');
    expect(description).not.toMatch(/\d{1,5}\s+\w+\s+(St|Street|Ave|Avenue|Rd|Road)/i);
  });

  it('creates one event on first sync, then patches the SAME event on subsequent syncs (idempotent)', async () => {
    const created = await upsertJobCalendarEvent(baseJob);
    expect(created).toBe('event-1');
    expect(calendarMock.inserted).toHaveLength(1);
    expect(jobUpdates).toHaveLength(1);
    expect(jobUpdates[0].calendarEventId).toBe('event-1');

    // Second sync — now with a calendarEventId, as if reloaded from the job row
    const updated = await upsertJobCalendarEvent({ ...baseJob, calendarEventId: 'event-1', cleanerName: 'Jane Cleaner' });
    expect(updated).toBe('event-1');
    expect(calendarMock.inserted).toHaveLength(1); // still just one insert ever
    expect(calendarMock.patched).toHaveLength(1);
    expect(calendarMock.patched[0].requestBody.summary).toContain('Jane Cleaner');
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
