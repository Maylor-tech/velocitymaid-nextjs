/**
 * Branch Owner Permissions
 * 
 * Defines what branch owners CAN and CANNOT do.
 * This is the "sacred table" - do not blur these lines.
 */

export const BRANCH_OWNER_PERMISSIONS = {
  // ✅ ALLOWED - Operational Powers
  canAssignJobs: true,
  canReassignJobs: true,
  canCancelJobs: true,
  canFlagJobsForReview: true,
  canViewCleanerProfiles: true,
  canRequestCleanerSuspension: true,
  canRequestCleanerReassignment: true,
  canEscalateIssues: true,
  canViewBranchMetrics: true, // Counts only, no financials
  canViewJobHistory: true,
  canViewCleanerRatings: true,
  
  // ❌ BLOCKED - Financial & System Override
  canViewPayouts: false,
  canViewPayoutAmounts: false,
  canTriggerPayouts: false,
  canApprovePayouts: false,
  canChangePricing: false,
  canEditJobPricing: false,
  canOverrideVerification: false,
  canEditPaymentMethods: false,
  canViewFinancialTotals: false,
  canViewRevenue: false,
  canViewPlatformWideData: false,
  canMarkJobsPaid: false,
  canOverrideCompletionRules: false,
} as const;

/**
 * Check if branch owner has permission for an action
 */
export function hasBranchOwnerPermission(action: keyof typeof BRANCH_OWNER_PERMISSIONS): boolean {
  return BRANCH_OWNER_PERMISSIONS[action] === true;
}

/**
 * Get all allowed permissions for branch owner
 */
export function getAllowedBranchOwnerPermissions(): string[] {
  return Object.entries(BRANCH_OWNER_PERMISSIONS)
    .filter(([_, allowed]) => allowed === true)
    .map(([action]) => action);
}

/**
 * Get all blocked permissions for branch owner
 */
export function getBlockedBranchOwnerPermissions(): string[] {
  return Object.entries(BRANCH_OWNER_PERMISSIONS)
    .filter(([_, allowed]) => allowed === false)
    .map(([action]) => action);
}














