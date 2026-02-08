/**
 * Branch Operator Permissions
 *
 * BRANCH_OPERATOR is scoped by region (primaryBranchId/UserBranch).
 * Allowed: job list (region only), job assignment, status updates, notes.
 * Blocked: admin, payouts, pricing, system settings.
 */

export const BRANCH_OPERATOR_PERMISSIONS = {
  // Allowed – operational, scoped to operator's branch
  canAssignJobs: true,
  canReassignJobs: true,
  canUpdateJobStatus: true,
  canAddJobNotes: true,
  canViewBranchJobs: true,
  canViewCleanerProfiles: true,

  // Blocked – admin, financial, system
  canAccessAdmin: false,
  canViewPayouts: false,
  canViewPayoutAmounts: false,
  canTriggerPayouts: false,
  canApprovePayouts: false,
  canChangePricing: false,
  canEditJobPricing: false,
  canAccessSystemSettings: false,
  canViewFinancialTotals: false,
  canViewPlatformWideData: false,
} as const;

export function hasBranchOperatorPermission(
  action: keyof typeof BRANCH_OPERATOR_PERMISSIONS
): boolean {
  return BRANCH_OPERATOR_PERMISSIONS[action] === true;
}
