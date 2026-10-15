/**
 * Owner assignee detection for Gate 2b payout skip.
 * Owner-staffed completes must not mint a JobPayout READY row.
 */

/** Production owner/admin cleaner id (Brian). Same value as historical tip reconcile. */
export const BRIAN_OWNER_CLEANER_ID = 'admin-1782271497170-94e9jc';

/** Caryll — real cleaner; must NOT be treated as owner skip. */
export const CARYLL_CLEANER_ID = '1a0483bc-8a0d-4837-9f00-5ec6b5d804d1';

export type OwnerAssigneeInput = {
  id: string;
  email?: string | null;
  role?: string | null;
};

/**
 * True when the assigned cleaner is the VelocityMaid owner (Brian).
 * Matches ADMIN_EMAIL and/or known Brian user id. Does not use role alone
 * or isInternalTeam (would skip Caryll / miss owner-as-CLEANER).
 */
export function isOwnerAssigneeForPayoutSkip(
  assignee: OwnerAssigneeInput | null | undefined
): boolean {
  if (!assignee?.id) return false;
  if (assignee.id === BRIAN_OWNER_CLEANER_ID) return true;

  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = assignee.email?.trim().toLowerCase();
  if (ownerEmail && email && email === ownerEmail) return true;

  return false;
}
