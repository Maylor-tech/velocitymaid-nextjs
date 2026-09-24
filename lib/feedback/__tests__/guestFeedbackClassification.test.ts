/**
 * Deterministic guest feedback classification + durable notes block.
 */
import { describe, expect, it } from 'vitest';
import {
  buildAdminNotesWithGuestClass,
  classifyGuestFeedback,
  mergeAdminNotesPreservingGuestClass,
  parseGuestClassFromAdminNotes,
  parseGuestIssueTopic,
  stripGuestClassBlock,
} from '@/lib/feedback/guestFeedbackClassification';

describe('classifyGuestFeedback', () => {
  it('NORMAL for high ratings without topic', () => {
    expect(
      classifyGuestFeedback({
        overallRating: 5,
        cleanlinessRating: 5,
      }).opsClass
    ).toBe('NORMAL');
  });

  it('NORMAL when guest selects good with high ratings', () => {
    const c = classifyGuestFeedback({
      overallRating: 5,
      cleanlinessRating: 4,
      issueTopic: 'good',
    });
    expect(c.opsClass).toBe('NORMAL');
    expect(c.issueTopic).toBe('good');
  });

  it('CONCERN for low cleanliness', () => {
    expect(
      classifyGuestFeedback({
        overallRating: 5,
        cleanlinessRating: 2,
      }).opsClass
    ).toBe('CONCERN');
  });

  it('CONCERN for low overall', () => {
    expect(
      classifyGuestFeedback({
        overallRating: 3,
        cleanlinessRating: 5,
      }).opsClass
    ).toBe('CONCERN');
  });

  it('CONCERN for cleaning topic', () => {
    expect(
      classifyGuestFeedback({
        overallRating: 5,
        cleanlinessRating: 5,
        issueTopic: 'cleaning',
      }).opsClass
    ).toBe('CONCERN');
  });

  it('URGENT for attention topic even with high ratings', () => {
    const c = classifyGuestFeedback({
      overallRating: 5,
      cleanlinessRating: 5,
      issueTopic: 'attention',
    });
    expect(c.opsClass).toBe('URGENT');
    expect(c.reasons).toContain('guest_selected_attention');
  });

  it('attention wins over cleaning', () => {
    // topic attention only — cleaning not combined; if someone somehow sent attention
    expect(
      classifyGuestFeedback({
        overallRating: 2,
        cleanlinessRating: 2,
        issueTopic: 'attention',
      }).opsClass
    ).toBe('URGENT');
  });
});

describe('guest class adminNotes block', () => {
  it('round-trips through notes', () => {
    const c = classifyGuestFeedback({
      overallRating: 2,
      cleanlinessRating: 2,
      issueTopic: 'cleaning',
    });
    const notes = buildAdminNotesWithGuestClass(c);
    const parsed = parseGuestClassFromAdminNotes(notes);
    expect(parsed?.opsClass).toBe('CONCERN');
    expect(parsed?.issueTopic).toBe('cleaning');
    expect(stripGuestClassBlock(notes)).toBe('');
  });

  it('preserves class when ops edits free text', () => {
    const c = classifyGuestFeedback({
      overallRating: 5,
      cleanlinessRating: 5,
      issueTopic: 'attention',
    });
    const existing = buildAdminNotesWithGuestClass(c);
    const merged = mergeAdminNotesPreservingGuestClass({
      existingNotes: existing,
      editableNotes: 'Called host; waiting on locksmith.',
    });
    expect(parseGuestClassFromAdminNotes(merged)?.opsClass).toBe('URGENT');
    expect(stripGuestClassBlock(merged)).toContain('locksmith');
  });

  it('parseGuestIssueTopic validates', () => {
    expect(parseGuestIssueTopic(undefined)).toBeUndefined();
    expect(parseGuestIssueTopic(null)).toBeNull();
    expect(parseGuestIssueTopic('cleaning')).toBe('cleaning');
    expect(parseGuestIssueTopic('nope')).toBeNull();
  });
});
