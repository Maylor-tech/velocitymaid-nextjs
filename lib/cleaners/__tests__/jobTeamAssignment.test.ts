import { describe, it, expect } from 'vitest';
import {
  buildOrderedCleanerIds,
  dedupeCleanerIds,
  draftFromOrderedIds,
  validateAndBuildCleanerIds,
} from '../jobTeamAssignment';

const BRIAN = 'brian-id';
const CARYLL = 'caryll-id';
const DORI = 'dori-id';

describe('jobTeamAssignment helpers', () => {
  it('one cleaner → primary only', () => {
    const result = validateAndBuildCleanerIds({
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [],
    });
    expect(result).toEqual({ ok: true, cleanerIds: [BRIAN] });
  });

  it('Brian + Caryll → ordered primary then assistant', () => {
    expect(
      buildOrderedCleanerIds({
        primaryCleanerId: BRIAN,
        assistantCleanerIds: [CARYLL],
      })
    ).toEqual([BRIAN, CARYLL]);
  });

  it('three-person team preserves order and labels semantics via index', () => {
    const ids = buildOrderedCleanerIds({
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [CARYLL, DORI],
    });
    expect(ids).toEqual([BRIAN, CARYLL, DORI]);
    expect(ids[0]).toBe(BRIAN); // primary
    expect(ids.slice(1)).toEqual([CARYLL, DORI]); // team members
  });

  it('prevents duplicate cleaner IDs', () => {
    const result = validateAndBuildCleanerIds({
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [CARYLL, CARYLL, BRIAN, DORI],
    });
    expect(result).toEqual({ ok: true, cleanerIds: [BRIAN, CARYLL, DORI] });
    expect(dedupeCleanerIds([BRIAN, BRIAN, CARYLL])).toEqual([BRIAN, CARYLL]);
  });

  it('removing an assistant rebuilds without them', () => {
    const before = draftFromOrderedIds([BRIAN, CARYLL, DORI]);
    const after = validateAndBuildCleanerIds({
      primaryCleanerId: before.primaryCleanerId,
      assistantCleanerIds: before.assistantCleanerIds.filter((id) => id !== CARYLL),
    });
    expect(after).toEqual({ ok: true, cleanerIds: [BRIAN, DORI] });
  });

  it('changing primary moves former primary out and drops duplicate', () => {
    const result = validateAndBuildCleanerIds({
      primaryCleanerId: CARYLL,
      assistantCleanerIds: [BRIAN, CARYLL],
    });
    expect(result).toEqual({ ok: true, cleanerIds: [CARYLL, BRIAN] });
  });

  it('empty-team behavior returns empty cleanerIds', () => {
    expect(
      validateAndBuildCleanerIds({
        primaryCleanerId: null,
        assistantCleanerIds: [],
      })
    ).toEqual({ ok: true, cleanerIds: [] });
  });

  it('rejects assistants without a primary', () => {
    const result = validateAndBuildCleanerIds({
      primaryCleanerId: null,
      assistantCleanerIds: [CARYLL],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/primary cleaner is required/i);
    }
  });

  it('draftFromOrderedIds round-trips', () => {
    expect(draftFromOrderedIds([BRIAN, CARYLL, DORI])).toEqual({
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [CARYLL, DORI],
    });
    expect(draftFromOrderedIds([])).toEqual({
      primaryCleanerId: null,
      assistantCleanerIds: [],
    });
  });
});
