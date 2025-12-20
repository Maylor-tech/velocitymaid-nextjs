/**
 * Phase L: Discount & Promo Guardrails
 * 
 * Enforces admin-only discounts with caps and reason codes.
 */

import { assertPricingPermission } from "@/lib/permissions/pricing";
import { UserRole } from "@prisma/client";

export interface DiscountRequest {
  amount: number;
  reason: string;
  percentage?: number; // If percentage-based
  maxPercentage?: number; // Cap (e.g., 10%)
}

export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
  cappedAmount?: number;
}

/**
 * Validate discount request
 * Enforces caps and reason requirements
 */
export function validateDiscount(
  basePrice: number,
  discount: DiscountRequest,
  role: UserRole
): DiscountValidationResult {
  // Check permission
  try {
    assertPricingPermission(role, "canApplyDiscounts");
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Permission denied: Only admins can apply discounts",
    };
  }

  // Require reason
  if (!discount.reason || discount.reason.trim().length === 0) {
    return {
      valid: false,
      error: "Discount reason is required",
    };
  }

  // Calculate percentage if amount provided
  let percentage = discount.percentage;
  if (!percentage && discount.amount) {
    percentage = (discount.amount / basePrice) * 100;
  }

  // Enforce cap (default 10% if not specified)
  const maxPercentage = discount.maxPercentage || 10;
  if (percentage && percentage > maxPercentage) {
    const cappedAmount = (basePrice * maxPercentage) / 100;
    return {
      valid: true,
      cappedAmount: Math.round(cappedAmount * 100) / 100, // Round to 2 decimals
      error: `Discount capped at ${maxPercentage}% (${cappedAmount.toFixed(2)})`,
    };
  }

  // Validate amount doesn't exceed base price
  const finalAmount = discount.amount || (basePrice * (percentage || 0)) / 100;
  if (finalAmount > basePrice) {
    return {
      valid: false,
      error: "Discount cannot exceed base price",
    };
  }

  if (finalAmount < 0) {
    return {
      valid: false,
      error: "Discount cannot be negative",
    };
  }

  return {
    valid: true,
    cappedAmount: Math.round(finalAmount * 100) / 100,
  };
}

/**
 * Apply discount to job (admin-only)
 * Returns updated price and logs discount
 */
export function applyDiscount(
  basePrice: number,
  discount: DiscountRequest,
  role: UserRole,
  adminId: string
): {
  success: boolean;
  finalPrice: number;
  discountAmount: number;
  error?: string;
  reason: string;
  approvedBy: string;
} {
  const validation = validateDiscount(basePrice, discount, role);

  if (!validation.valid) {
    return {
      success: false,
      finalPrice: basePrice,
      discountAmount: 0,
      error: validation.error,
      reason: discount.reason,
      approvedBy: adminId,
    };
  }

  const discountAmount = validation.cappedAmount || discount.amount || 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    success: true,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    reason: discount.reason,
    approvedBy: adminId,
  };
}

/**
 * Get discount reason codes (standardized)
 */
export const DISCOUNT_REASON_CODES = {
  CUSTOMER_COMPLAINT: "Customer complaint resolution",
  LOYALTY_REWARD: "Loyalty program reward",
  REFERRAL_BONUS: "Referral program bonus",
  FIRST_TIME_CUSTOMER: "First-time customer discount",
  PROMOTIONAL: "Promotional discount",
  ADMIN_OVERRIDE: "Admin override (special circumstances)",
  PRICE_MATCH: "Competitor price match",
  VOLUME_DISCOUNT: "Volume/contract discount",
} as const;

export type DiscountReasonCode = keyof typeof DISCOUNT_REASON_CODES;



