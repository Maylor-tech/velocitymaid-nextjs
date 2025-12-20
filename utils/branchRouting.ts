/**
 * Branch Routing Utilities
 * 
 * Resolves branch by ZIP code and handles routing logic
 */

import { getServiceAreaByZip, getBranchById } from './branchData';
import type { Branch } from './branchData';

/**
 * Resolve branch by ZIP code
 * 
 * @param zipCode - The ZIP code to resolve
 * @returns The best-matching Branch or null
 */
export function resolveBranchByZip(zipCode: string): Branch | null {
  // Normalize ZIP code
  const normalizedZip = zipCode.trim();
  
  if (!normalizedZip) {
    return null;
  }

  // Get service area by ZIP
  const serviceArea = getServiceAreaByZip(normalizedZip);
  
  if (!serviceArea) {
    return null;
  }

  // Get branch and verify it's active
  const branch = getBranchById(serviceArea.branchId);
  
  if (!branch || branch.status !== 'ACTIVE') {
    return null;
  }

  return branch;
}

/**
 * Resolve branch slug by ZIP code
 * 
 * @param zipCode - The ZIP code to resolve
 * @returns The branch slug or null
 */
export function resolveBranchSlugByZip(zipCode: string): string | null {
  const branch = resolveBranchByZip(zipCode);
  return branch?.slug || null;
}

/**
 * Check if ZIP code is served by any branch
 * 
 * @param zipCode - The ZIP code to check
 * @returns True if ZIP is served
 */
export function isZipCodeServed(zipCode: string): boolean {
  return resolveBranchByZip(zipCode) !== null;
}




