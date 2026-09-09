export const ASSIGNMENT_RELEASED = 'RELEASED';
export const JOB_ASSIGNMENT_RELEASED = 'JOB_ASSIGNMENT_RELEASED';

export const RELEASE_REASON_CODES = [
  'CLEANER_UNAVAILABLE',
  'CLEANER_REQUESTED_RELEASE',
  'SCHEDULING_CONFLICT',
  'EMERGENCY',
  'ADMIN_CORRECTION',
  'OTHER',
] as const;

export type ReleaseReasonCode = (typeof RELEASE_REASON_CODES)[number];

export const RELEASE_REASON_LABELS: Record<ReleaseReasonCode, string> = {
  CLEANER_UNAVAILABLE: 'Cleaner unavailable',
  CLEANER_REQUESTED_RELEASE: 'Cleaner requested release',
  SCHEDULING_CONFLICT: 'Scheduling conflict',
  EMERGENCY: 'Emergency',
  ADMIN_CORRECTION: 'Admin correction',
  OTHER: 'Other',
};

export function isReleaseReasonCode(value: unknown): value is ReleaseReasonCode {
  return (
    typeof value === 'string' &&
    (RELEASE_REASON_CODES as readonly string[]).includes(value)
  );
}

export function releaseReasonLabel(code: ReleaseReasonCode): string {
  return RELEASE_REASON_LABELS[code];
}
