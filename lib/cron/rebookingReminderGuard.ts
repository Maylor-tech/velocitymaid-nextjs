export const REBOOKING_REMINDERS_ENABLED_ENV = 'REBOOKING_REMINDERS_ENABLED';

const EXPLICITLY_DISABLED = new Set(['false', '0', 'off', 'disabled']);

/**
 * Sending stays on unless this deployment's environment explicitly disables it.
 * Unset, blank, and any other value keep the current production behavior.
 * Read this at request time. A Vercel deployment keeps the environment it was
 * created with, so changing the project setting does not change an older deployment.
 */
export function isRebookingReminderSendingEnabled(
  value: string | null = process.env[REBOOKING_REMINDERS_ENABLED_ENV] ?? null
): boolean {
  if (typeof value !== 'string') return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return true;
  return !EXPLICITLY_DISABLED.has(normalized);
}

export function rebookingRemindersDisabledResponse() {
  return {
    success: true,
    disabled: true,
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
}
