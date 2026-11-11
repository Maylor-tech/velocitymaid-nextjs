import { describe, expect, it } from 'vitest';
import { isRebookingReminderSendingEnabled } from '../rebookingReminderGuard';

describe('rebooking reminder enablement', () => {
  it('stays enabled when the control is unset, blank, or not an explicit disable', () => {
    expect(isRebookingReminderSendingEnabled(null)).toBe(true);
    expect(isRebookingReminderSendingEnabled('')).toBe(true);
    expect(isRebookingReminderSendingEnabled('   ')).toBe(true);
    expect(isRebookingReminderSendingEnabled('true')).toBe(true);
    expect(isRebookingReminderSendingEnabled('TRUE')).toBe(true);
    expect(isRebookingReminderSendingEnabled('yes')).toBe(true);
  });

  it('turns off only for an explicit disable value', () => {
    for (const value of ['false', ' FALSE ', '0', 'off', 'OFF', 'disabled']) {
      expect(isRebookingReminderSendingEnabled(value)).toBe(false);
    }
  });
});
