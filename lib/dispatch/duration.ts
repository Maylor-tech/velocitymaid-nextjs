/** Server-derived clean duration. Never trust a browser-only timer. */

export function computeCleanDurationMins(input: {
  startedAt: Date | null | undefined;
  completedAt: Date | null | undefined;
  existingMins?: number | null;
}): number | null {
  if (input.existingMins != null && Number.isFinite(input.existingMins) && input.existingMins > 0) {
    return Math.round(input.existingMins);
  }
  if (!input.startedAt || !input.completedAt) return null;
  const ms = input.completedAt.getTime() - input.startedAt.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.max(1, Math.round(ms / 60000));
}

export function elapsedMsSince(startedAt: Date, now: Date = new Date()): number {
  return Math.max(0, now.getTime() - startedAt.getTime());
}
