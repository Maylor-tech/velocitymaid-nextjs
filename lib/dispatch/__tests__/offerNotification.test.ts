import { describe, expect, it } from 'vitest';
import {
  offerNotificationLabel,
  toOfferNotificationView,
} from '../offerNotification';

describe('toOfferNotificationView', () => {
  it('maps SUCCESS to Sent with timestamp', () => {
    const view = toOfferNotificationView({
      status: 'SUCCESS',
      createdAt: new Date('2026-09-08T13:40:00.000Z'),
    });
    expect(view).toEqual({
      status: 'SENT',
      recordedAt: '2026-09-08T13:40:00.000Z',
      attemptCount: 0,
    });
    expect(offerNotificationLabel(view.status)).toBe('Sent');
    expect(
      toOfferNotificationView(
        { status: 'SUCCESS', createdAt: new Date('2026-09-08T13:40:00.000Z') },
        4
      ).attemptCount
    ).toBe(4);
  });

  it('maps FAILED to Failed with timestamp', () => {
    const view = toOfferNotificationView({
      status: 'FAILED',
      createdAt: '2026-09-08T13:41:00.000Z',
    });
    expect(view.status).toBe('FAILED');
    expect(view.recordedAt).toBe('2026-09-08T13:41:00.000Z');
    expect(offerNotificationLabel(view.status)).toBe('Failed');
  });

  it('is Not recorded when no log row exists', () => {
    expect(toOfferNotificationView(null)).toEqual({
      status: 'NOT_RECORDED',
      recordedAt: null,
      attemptCount: 0,
    });
    expect(toOfferNotificationView(null, 3)).toEqual({
      status: 'NOT_RECORDED',
      recordedAt: null,
      attemptCount: 3,
    });
    expect(offerNotificationLabel('NOT_RECORDED')).toBe('Not recorded');
  });
});
