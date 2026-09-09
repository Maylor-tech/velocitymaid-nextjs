import { describe, expect, it } from 'vitest';
import {
  classifyDispatchException,
  groupDispatchExceptionItems,
  serviceDayBucket,
} from '../dispatchExceptions';

const NOW = new Date('2026-09-08T20:00:00.000Z'); // afternoon ET on Sep 8
const TODAY = new Date('2026-09-08T00:00:00.000Z');
const TOMORROW = new Date('2026-09-09T00:00:00.000Z');
const NEXT_WEEK = new Date('2026-09-15T00:00:00.000Z');
const LIVE_EXPIRES = new Date('2099-01-01T00:00:00.000Z');
const PAST_EXPIRES = new Date('2020-01-01T00:00:00.000Z');

describe('serviceDayBucket', () => {
  it('uses UTC-midnight service dates so today/tomorrow do not shift', () => {
    expect(serviceDayBucket(TODAY, NOW)).toBe('today');
    expect(serviceDayBucket(TOMORROW, NOW)).toBe('tomorrow');
    expect(serviceDayBucket(NEXT_WEEK, NOW)).toBe('other');
  });
});

describe('classifyDispatchException', () => {
  it('returns null for assigned jobs', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: 'user-dorottya',
          preferredDate: TOMORROW,
        },
        NOW
      )
    ).toBeNull();
  });

  it('prioritizes today unassigned over an active offer', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: TODAY,
          status: 'RECEIVED',
          offers: [{ status: 'OFFERED', expiresAt: LIVE_EXPIRES }],
        },
        NOW
      )
    ).toBe('TODAY_UNASSIGNED');
  });

  it('prioritizes tomorrow unassigned over notification failed', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: TOMORROW,
          status: 'RECEIVED',
          latestOfferEmailStatus: 'FAILED',
          offers: [{ status: 'OFFERED', expiresAt: LIVE_EXPIRES }],
        },
        NOW
      )
    ).toBe('TOMORROW_UNASSIGNED');
  });

  it('is notification failed when email failed and the job is later', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: NEXT_WEEK,
          status: 'RECEIVED',
          latestOfferEmailStatus: 'FAILED',
          offers: [{ status: 'OFFERED', expiresAt: LIVE_EXPIRES }],
        },
        NOW
      )
    ).toBe('NOTIFICATION_FAILED');
  });

  it('is expired/declined cleaner-needed after decline with no live offer', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: NEXT_WEEK,
          status: 'RECEIVED',
          offers: [{ status: 'DECLINED', expiresAt: LIVE_EXPIRES }],
        },
        NOW
      )
    ).toBe('EXPIRED_OR_DECLINED');
  });

  it('is expired/declined when stored OFFERED is past expiresAt', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: NEXT_WEEK,
          status: 'RECEIVED',
          offers: [{ status: 'OFFERED', expiresAt: PAST_EXPIRES }],
        },
        NOW
      )
    ).toBe('EXPIRED_OR_DECLINED');
  });

  it('is awaiting response for a live offer on a later day', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: NEXT_WEEK,
          status: 'RECEIVED',
          latestOfferEmailStatus: 'SUCCESS',
          offers: [{ status: 'OFFERED', expiresAt: LIVE_EXPIRES }],
        },
        NOW
      )
    ).toBe('AWAITING_RESPONSE');
  });

  it('is cleaner needed with no active offer when never offered', () => {
    expect(
      classifyDispatchException(
        {
          assignedCleanerId: null,
          preferredDate: NEXT_WEEK,
          status: 'RECEIVED',
          offers: [],
        },
        NOW
      )
    ).toBe('CLEANER_NEEDED_NO_OFFER');
  });
});

describe('groupDispatchExceptionItems priority', () => {
  it('lists tomorrow unassigned after today and before notification failed', () => {
    const items = groupDispatchExceptionItems([
      { id: 'j-await', name: 'Await', kind: 'AWAITING_RESPONSE' },
      { id: 'j-fail', name: 'Fail', kind: 'NOTIFICATION_FAILED' },
      { id: 'j-tom', name: 'Tomorrow', kind: 'TOMORROW_UNASSIGNED' },
      { id: 'j-today', name: 'Today', kind: 'TODAY_UNASSIGNED' },
    ]);
    expect(items.filter((i) => i.count > 0).map((i) => i.id)).toEqual([
      'dispatch-today-unassigned',
      'dispatch-tomorrow-unassigned',
      'dispatch-notification-failed',
      'dispatch-awaiting',
    ]);
    expect(items.map((i) => i.priority)).toEqual([10, 20, 30, 40, 50, 60]);
  });
});
