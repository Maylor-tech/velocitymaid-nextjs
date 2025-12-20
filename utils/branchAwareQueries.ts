/**
 * Branch-Aware Query Utilities
 * 
 * Filters data based on user's branch assignments
 */

import { getUserBranches } from './userData';
import type { Branch } from './branchData';

/**
 * Get branch IDs for a user
 * 
 * @param userId - The user ID
 * @returns Array of branch IDs the user has access to
 */
export function getUserBranchIds(userId: string): string[] {
  const userBranches = getUserBranches(userId);
  return userBranches.map(ub => ub.branchId);
}

/**
 * Check if user has access to branch
 * 
 * @param userId - The user ID
 * @param branchId - The branch ID to check
 * @returns True if user has access
 */
export function userHasAccessToBranch(userId: string, branchId: string): boolean {
  const branchIds = getUserBranchIds(userId);
  return branchIds.includes(branchId);
}

/**
 * Filter jobs by user's branch access
 * 
 * @param jobs - Array of jobs
 * @param userId - The user ID
 * @param userRole - The user's role
 * @returns Filtered jobs
 */
export function filterJobsByBranchAccess<T extends { branchId: string }>(
  jobs: T[],
  userId: string,
  userRole: 'ADMIN' | 'MANAGER' | 'CLEANER' | 'SUPPORT'
): T[] {
  // Admins see all jobs
  if (userRole === 'ADMIN') {
    return jobs;
  }

  // Get user's branch IDs
  const branchIds = getUserBranchIds(userId);

  // Filter jobs to only those in user's branches
  return jobs.filter(job => branchIds.includes(job.branchId));
}

/**
 * Filter customers by user's branch access
 * 
 * @param customers - Array of customers
 * @param userId - The user ID
 * @param userRole - The user's role
 * @returns Filtered customers
 */
export function filterCustomersByBranchAccess<T extends { branchId: string | null }>(
  customers: T[],
  userId: string,
  userRole: 'ADMIN' | 'MANAGER' | 'CLEANER' | 'SUPPORT'
): T[] {
  // Admins see all customers
  if (userRole === 'ADMIN') {
    return customers;
  }

  // Get user's branch IDs
  const branchIds = getUserBranchIds(userId);

  // Filter customers to only those in user's branches
  return customers.filter(customer => 
    customer.branchId && branchIds.includes(customer.branchId)
  );
}

/**
 * Filter payouts by user's branch access
 * 
 * @param payouts - Array of payouts
 * @param userId - The user ID
 * @param userRole - The user's role
 * @param getJobBranchId - Function to get branchId from payout (via jobId)
 * @returns Filtered payouts
 */
export function filterPayoutsByBranchAccess<T>(
  payouts: T[],
  userId: string,
  userRole: 'ADMIN' | 'MANAGER' | 'CLEANER' | 'SUPPORT',
  getJobBranchId: (payout: T) => string | null
): T[] {
  // Admins see all payouts
  if (userRole === 'ADMIN') {
    return payouts;
  }

  // Get user's branch IDs
  const branchIds = getUserBranchIds(userId);

  // Filter payouts to only those in user's branches
  return payouts.filter(payout => {
    const branchId = getJobBranchId(payout);
    return branchId && branchIds.includes(branchId);
  });
}




