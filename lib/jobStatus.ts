/**
 * Job Status Lifecycle Helper
 * 
 * Provides safe status transitions and validation for job status changes
 */

export const JOB_STATUSES = [
  "RECEIVED",
  "CONFIRMED",
  "ASSIGNED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REASSIGN_PENDING",
] as const;

export type JobStatus = typeof JOB_STATUSES[number];

/**
 * Valid status transitions
 * Key: from status, Value: array of valid to statuses
 */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  RECEIVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ON_THE_WAY", "REASSIGN_PENDING", "CANCELLED"],
  ON_THE_WAY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  REASSIGN_PENDING: ["ASSIGNED", "CANCELLED"],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function canTransition(from: string, to: string): boolean {
  if (!JOB_STATUSES.includes(from as JobStatus)) {
    return false;
  }
  if (!JOB_STATUSES.includes(to as JobStatus)) {
    return false;
  }

  const validNextStatuses = VALID_TRANSITIONS[from as JobStatus];
  return validNextStatuses.includes(to as JobStatus);
}

/**
 * Get all valid next statuses for a current status
 */
export function getNextStatuses(current: string): JobStatus[] {
  if (!JOB_STATUSES.includes(current as JobStatus)) {
    return [];
  }
  return VALID_TRANSITIONS[current as JobStatus];
}

/**
 * Assert that a transition is valid, throw error if not
 */
export function assertTransition(from: string, to: string): void {
  if (!JOB_STATUSES.includes(from as JobStatus)) {
    throw new Error(`Invalid current status: ${from}. Must be one of: ${JOB_STATUSES.join(", ")}`);
  }

  if (!JOB_STATUSES.includes(to as JobStatus)) {
    throw new Error(`Invalid target status: ${to}. Must be one of: ${JOB_STATUSES.join(", ")}`);
  }

  if (!canTransition(from, to)) {
    const validNext = getNextStatuses(from);
    throw new Error(
      `Invalid status transition: ${from} → ${to}. ` +
      `Valid transitions from ${from} are: ${validNext.length > 0 ? validNext.join(", ") : "none (terminal state)"}`
    );
  }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

