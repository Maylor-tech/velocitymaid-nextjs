/**
 * Worker classification — deliberate admin action only.
 * Never infer from application checkboxes, payment method, offers, or schedule.
 */

export const CLASSIFICATION_STATUSES = [
  'UNRESOLVED',
  'EMPLOYEE',
  'INDEPENDENT_CONTRACTOR',
] as const;

export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];

export const DEFAULT_CLASSIFICATION_STATUS: ClassificationStatus = 'UNRESOLVED';

export function isClassificationStatus(value: unknown): value is ClassificationStatus {
  return (
    typeof value === 'string' &&
    (CLASSIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

/** Parse or fall back to UNRESOLVED. Never invent EMPLOYEE / IC. */
export function normalizeClassificationStatus(
  value: string | null | undefined
): ClassificationStatus {
  if (isClassificationStatus(value)) return value;
  return DEFAULT_CLASSIFICATION_STATUS;
}

/**
 * Forbidden: any automatic transition out of UNRESOLVED.
 * Classification changes must go through explicit admin update + audit.
 */
export function assertDeliberateClassificationChange(
  from: ClassificationStatus,
  to: ClassificationStatus
): { ok: true } | { ok: false; error: string } {
  if (from === to) return { ok: true };
  if (!isClassificationStatus(to)) {
    return { ok: false, error: 'Invalid classificationStatus' };
  }
  // Allowed when explicit — this helper does not auto-change; callers must pass deliberate `to`.
  return { ok: true };
}
