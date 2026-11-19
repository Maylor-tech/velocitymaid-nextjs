import { describe, expect, it } from 'vitest';
import {
  formatOfferLifecycleLabel,
  offerLifecyclePill,
} from '../offerLifecycleLabel';

const NOW = new Date('2026-11-17T15:00:00.000Z');
const FUTURE = new Date('2026-11-18T15:00:00.000Z').toISOString();
const PAST = new Date('2026-11-16T15:00:00.000Z').toISOString();

describe('formatOfferLifecycleLabel', () => {
  it('reports no offer without inventing stages', () => {
    expect(formatOfferLifecycleLabel({ offer: null })).toBe('No offer created');
  });

  it('never says delivered when notification was SENT', () => {
    const label = formatOfferLifecycleLabel({
      offer: { status: 'OFFERED', expiresAt: FUTURE },
      notification: { status: 'SENT', attemptCount: 1 },
      now: NOW,
    });
    expect(label).toContain('email sent');
    expect(label.toLowerCase()).not.toContain('delivered');
    expect(label).toContain('not yet accepted');
  });

  it('uses unknown when notification is not recorded', () => {
    const label = formatOfferLifecycleLabel({
      offer: { status: 'OFFERED', expiresAt: FUTURE },
      notification: { status: 'NOT_RECORDED' },
      now: NOW,
    });
    expect(label).toContain('notification unknown');
  });

  it('marks failed notifications without claiming delivery', () => {
    const label = formatOfferLifecycleLabel({
      offer: { status: 'OFFERED', expiresAt: FUTURE },
      notification: { status: 'FAILED', attemptCount: 2 },
      now: NOW,
    });
    expect(label).toContain('email failed');
  });

  it('includes accepted and assigned when job is assigned', () => {
    const label = formatOfferLifecycleLabel({
      offer: { status: 'ACCEPTED', expiresAt: FUTURE },
      notification: { status: 'SENT', attemptCount: 1 },
      jobAssigned: true,
      now: NOW,
    });
    expect(label).toContain('accepted');
    expect(label).toContain('assigned');
  });

  it('treats past-due OFFERED as expired', () => {
    const label = formatOfferLifecycleLabel({
      offer: { status: 'OFFERED', expiresAt: PAST },
      notification: { status: 'SENT', attemptCount: 1 },
      now: NOW,
    });
    expect(label).toContain('expired');
  });
});

describe('offerLifecyclePill', () => {
  it('labels open sent offers as awaiting acceptance', () => {
    expect(
      offerLifecyclePill({
        offer: { status: 'OFFERED', expiresAt: FUTURE },
        notification: { status: 'SENT' },
        now: NOW,
      })
    ).toBe('Awaiting acceptance');
  });
});
