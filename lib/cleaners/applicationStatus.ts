/** Statuses that qualify a cleaner for assignment (legacy APPROVED + new ACCEPTED). */
export const APPROVED_CLEANER_APPLICATION_STATUSES = ['APPROVED', 'ACCEPTED'] as const;

export function isApprovedCleanerApplication(status: string): boolean {
  return (APPROVED_CLEANER_APPLICATION_STATUSES as readonly string[]).includes(status);
}

/** Statuses admin can still action (approve / reject / move pipeline). */
export const OPEN_CLEANER_APPLICATION_STATUSES = [
  'NEW',
  'REVIEWING',
  'PENDING',
  'TRAINING_INVITED',
] as const;

export function isOpenCleanerApplication(status: string): boolean {
  return (OPEN_CLEANER_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export const CLEANER_APPLICATION_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  REVIEWING: 'Reviewing',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  TRAINING_INVITED: 'Training invited',
  PENDING: 'Pending (legacy)',
  APPROVED: 'Approved (legacy)',
};
