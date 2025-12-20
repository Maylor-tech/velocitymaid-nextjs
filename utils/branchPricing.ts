/**
 * Branch Pricing Utilities
 * 
 * Functions to get branch-specific pricing for services
 */

import {
  getBranchBySlug,
  getBranchById,
  getServicePackagesByBranchId,
  type Branch,
  type BranchServicePackage,
} from './branchData';
import { resolveBranchByZip } from './branchRouting';

/**
 * Get service package by code for a branch
 */
export function getServicePackageByCode(
  branchId: string,
  code: string
): BranchServicePackage | null {
  const packages = getServicePackagesByBranchId(branchId);
  return packages.find(pkg => pkg.code === code) || null;
}

/**
 * Get pricing for a service type in a branch
 */
export function getServicePrice(
  branchId: string | null,
  serviceType: 'basic' | 'deep' | 'moveInOut'
): number {
  if (!branchId) {
    // Default pricing if no branch
    const defaultPrices: Record<string, number> = {
      basic: 120,
      deep: 220,
      moveInOut: 320,
    };
    return defaultPrices[serviceType] || 120;
  }

  // Map service type to package code
  const codeMap: Record<string, string> = {
    basic: 'BASIC_CLEAN',
    deep: 'DEEP_CLEAN',
    moveInOut: 'MOVE_IN_OUT',
  };

  const code = codeMap[serviceType];
  if (!code) {
    return 120; // Default
  }

  const pkg = getServicePackageByCode(branchId, code);
  return pkg?.basePrice || 120;
}

/**
 * Get add-on pricing for a branch
 * For now, add-ons are the same across all branches
 */
export function getAddOnPrice(addOnType: 'laundry' | 'windows' | 'oven' | 'refrigerator'): number {
  const prices: Record<string, number> = {
    laundry: 15,
    windows: 20,
    oven: 30,
    refrigerator: 25,
  };
  return prices[addOnType] || 0;
}

/**
 * Get branch pricing for booking
 * Resolves branch from ZIP code or location
 */
export function getBranchPricingForBooking(
  zipCode?: string | null,
  serviceLocation?: 'new_jersey' | 'vermont' | string | null
): {
  branchId: string | null;
  branchSlug: string | null;
  prices: {
    basic: number;
    deep: number;
    moveInOut: number;
    addOns: {
      laundry: number;
      windows: number;
      oven: number;
      refrigerator: number;
    };
  };
} {
  let branch: Branch | null = null;

  // Try to resolve by ZIP code first
  if (zipCode) {
    branch = resolveBranchByZip(zipCode);
  }

  // Fallback to location-based slug
  if (!branch && serviceLocation) {
    const slugMap: Record<string, string> = {
      new_jersey: 'new-jersey',
      vermont: 'vermont',
      boston: 'boston',
      'new_york_city': 'new-york-city',
      nyc: 'new-york-city',
      'port_antonio': 'port-antonio',
    };
    const slug = slugMap[serviceLocation.toLowerCase()] || serviceLocation.toLowerCase().replace(/_/g, '-');
    branch = getBranchBySlug(slug);
  }

  const branchId = branch?.id || null;
  const branchSlug = branch?.slug || null;

  return {
    branchId,
    branchSlug,
    prices: {
      basic: getServicePrice(branchId, 'basic'),
      deep: getServicePrice(branchId, 'deep'),
      moveInOut: getServicePrice(branchId, 'moveInOut'),
      addOns: {
        laundry: getAddOnPrice('laundry'),
        windows: getAddOnPrice('windows'),
        oven: getAddOnPrice('oven'),
        refrigerator: getAddOnPrice('refrigerator'),
      },
    },
  };
}




