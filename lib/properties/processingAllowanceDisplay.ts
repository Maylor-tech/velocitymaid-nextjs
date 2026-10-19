import { applyProcessingProtection } from '@/lib/pricing/processingProtection';
import { roundMoney } from '@/lib/pricing/money';
import type { PropertyPaymentMethod } from '@/lib/properties/servicePackage';

export type ProcessingAllowanceDisplay = {
  preferredMethod: PropertyPaymentMethod | null;
  estimatedAllowance: number;
  /** The agreed customer price is never replaced by this estimate. */
  customerPriceUnchanged: true;
};

const NO_ALLOWANCE = new Set<PropertyPaymentMethod>(['CASH', 'CHECK', 'ZELLE']);

/**
 * Internal estimate only. Cash, check, and Zelle stay at $0.
 * Card uses the existing processing-protection calculator and does not
 * change the amount the customer is charged.
 */
export function displayProcessingAllowance(input: {
  preferredMethod: PropertyPaymentMethod | null;
  operationalSubtotal: number;
  policy: {
    enabled: boolean;
    percentageRate: number;
    fixedFee: number;
    roundingIncrement: number;
  } | null;
}): ProcessingAllowanceDisplay {
  const base = {
    preferredMethod: input.preferredMethod,
    customerPriceUnchanged: true as const,
  };
  if (!input.preferredMethod || NO_ALLOWANCE.has(input.preferredMethod)) {
    return { ...base, estimatedAllowance: 0 };
  }
  if (!input.policy?.enabled || !(input.operationalSubtotal > 0)) {
    return { ...base, estimatedAllowance: 0 };
  }
  try {
    const result = applyProcessingProtection({
      operationalSubtotal: input.operationalSubtotal,
      percentageRate: input.policy.percentageRate,
      fixedFee: Math.max(0, input.policy.fixedFee),
      roundingIncrement: input.policy.roundingIncrement > 0 ? input.policy.roundingIncrement : 5,
    });
    return {
      ...base,
      estimatedAllowance: roundMoney(result.processingAllowanceEstimated),
    };
  } catch {
    return { ...base, estimatedAllowance: 0 };
  }
}
