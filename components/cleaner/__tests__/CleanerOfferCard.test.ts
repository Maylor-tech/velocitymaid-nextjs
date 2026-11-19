import { describe, expect, it } from 'vitest';
import {
  formatOfferLifecycleForCleaner,
  formatRespondByLabel,
} from '../CleanerOfferCard';

describe('formatRespondByLabel', () => {
  it('formats same-day respond-by time', () => {
    const now = new Date('2026-11-18T12:00:00');
    const label = formatRespondByLabel(
      '2026-11-18T18:00:00',
      false,
      now
    );
    expect(label.toLowerCase()).toContain('respond by');
    expect(label.toLowerCase()).toMatch(/6/);
  });

  it('returns Expired when expired', () => {
    expect(formatRespondByLabel('2026-11-18T18:00:00', true)).toBe('Expired');
  });
});

describe('formatOfferLifecycleForCleaner', () => {
  it('uses the five-stage admin labels without inventing delivery', () => {
    const label = formatOfferLifecycleForCleaner({
      status: 'OFFERED',
      expiresAt: '2027-06-01T00:00:00.000Z',
      expired: false,
    });
    expect(label).toContain('Offer created');
    expect(label).toContain('not yet accepted');
    expect(label.toLowerCase()).not.toContain('delivered');
  });
});
