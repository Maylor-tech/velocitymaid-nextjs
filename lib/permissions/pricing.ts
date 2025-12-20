/**
 * Phase L: Pricing & Revenue Locks - Permissions
 * 
 * Defines who can view, edit, and apply discounts to pricing.
 * This is the "sacred table" - do not blur these lines.
 */

import { UserRole } from "@prisma/client";

export type PricingPermission = 'view' | 'edit' | 'discount' | 'viewHistory' | 'overrideLock';

export interface PricingPermissions {
  canViewPrices: boolean;
  canEditPrices: boolean;
  canApplyDiscounts: boolean;
  canViewPricingHistory: boolean;
  canOverridePriceLock: boolean; // With void + rebook only
}

export const PRICING_PERMISSIONS: Record<UserRole, PricingPermissions> = {
  ADMIN: {
    canViewPrices: true,
    canEditPrices: true,
    canApplyDiscounts: true,
    canViewPricingHistory: true,
    canOverridePriceLock: true, // With void + rebook
  },
  MANAGER: {
    canViewPrices: true,
    canEditPrices: true, // Managers can edit (same as admin for now)
    canApplyDiscounts: true,
    canViewPricingHistory: true,
    canOverridePriceLock: true,
  },
  BRANCH_OWNER: {
    canViewPrices: true, // Read-only
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: false,
    canOverridePriceLock: false,
  },
  CLEANER: {
    canViewPrices: false, // Never sees totals
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: false,
    canOverridePriceLock: false,
  },
  SUPPORT: {
    canViewPrices: true, // Support can view for customer service
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: true,
    canOverridePriceLock: false,
  },
} as const;

/**
 * Check if a role has a specific pricing permission
 */
export function hasPricingPermission(
  role: UserRole,
  permission: keyof PricingPermissions
): boolean {
  return PRICING_PERMISSIONS[role]?.[permission] === true;
}

/**
 * Get all allowed permissions for a role
 */
export function getAllowedPricingPermissions(role: UserRole): string[] {
  const permissions = PRICING_PERMISSIONS[role];
  return Object.entries(permissions)
    .filter(([_, allowed]) => allowed === true)
    .map(([permission]) => permission);
}

/**
 * Get all blocked permissions for a role
 */
export function getBlockedPricingPermissions(role: UserRole): string[] {
  const permissions = PRICING_PERMISSIONS[role];
  return Object.entries(permissions)
    .filter(([_, allowed]) => allowed === false)
    .map(([permission]) => permission);
}

/**
 * Assert that a role has a specific pricing permission
 * Throws error if permission denied
 */
export function assertPricingPermission(
  role: UserRole,
  permission: keyof PricingPermissions
): void {
  if (!hasPricingPermission(role, permission)) {
    throw new Error(
      `Permission denied: ${role} cannot ${permission.replace(/([A-Z])/g, ' $1').toLowerCase()}`
    );
  }
}



