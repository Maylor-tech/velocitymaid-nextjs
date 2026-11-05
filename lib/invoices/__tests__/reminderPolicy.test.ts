import { describe, expect, it } from 'vitest';
import { contactDate, reminderStage, inReminderSendWindow, reminderCandidates } from '../reminderPolicy';

describe('invoice reminder calendar policy', () => {
  const now = new Date('2026-10-31T15:00:00Z');
  it.each([
    ['2026-11-02', null], ['2026-11-01', 'due_soon'], ['2026-10-31', 'due_today'],
    ['2026-10-30', 'overdue_1'], ['2026-10-25', 'overdue_1'], ['2026-10-24', 'overdue_7'],
  ])('maps due date %s to %s', (due, stage) => expect(reminderStage(new Date(due), now)).toBe(stage));
  it('does not shift UTC-midnight due dates back one day', () => {
    expect(reminderStage(new Date('2026-10-31T00:00:00Z'), now)).toBe('due_today');
  });
  it('uses the Vermont calendar near UTC midnight', () => {
    expect(contactDate(new Date('2026-11-01T01:00:00Z'))).toBe('2026-10-31');
  });
  it('handles the fall DST transition and guards customer send hours', () => {
    expect(inReminderSendWindow(new Date('2026-10-31T12:00:00Z'))).toBe(true);
    expect(inReminderSendWindow(new Date('2026-11-01T12:00:00Z'))).toBe(false);
    expect(inReminderSendWindow(new Date('2026-11-01T13:00:00Z'))).toBe(true);
    expect(inReminderSendWindow(new Date('2026-11-01T23:00:00Z'))).toBe(false);
  });
  it('skips missing/invalid dates', () => {
    expect(reminderStage(null, now)).toBeNull();
    expect(reminderStage(new Date('invalid'), now)).toBeNull();
  });
  it('filters already-recorded stages before limiting the candidate query', () => {
    expect(reminderCandidates(now)[1]).toEqual({
      dueDate: { gte: new Date('2026-10-31'), lt: new Date('2026-11-01') },
      reminderDeliveries: { none: { stage: 'due_today', status: { not: 'FAILED' } } },
    });
  });
});
