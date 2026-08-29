import { describe, expect, it } from 'vitest';
import { computeCleanDurationMins } from '../duration';

describe('clean duration', () => {
  it('computes minutes from startedAt to completedAt', () => {
    expect(
      computeCleanDurationMins({
        startedAt: new Date('2026-08-28T14:00:00.000Z'),
        completedAt: new Date('2026-08-28T16:10:00.000Z'),
      })
    ).toBe(130);
  });

  it('keeps an existing duration when already recorded', () => {
    expect(
      computeCleanDurationMins({
        startedAt: new Date('2026-08-28T14:00:00.000Z'),
        completedAt: new Date('2026-08-28T16:00:00.000Z'),
        existingMins: 95,
      })
    ).toBe(95);
  });

  it('returns null without a start timestamp', () => {
    expect(
      computeCleanDurationMins({
        startedAt: null,
        completedAt: new Date(),
      })
    ).toBeNull();
  });
});
