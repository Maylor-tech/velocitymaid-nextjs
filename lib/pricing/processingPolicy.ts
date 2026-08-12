/**
 * Load payment-processing protection policy from AdminPlatformSettings.
 * Feature defaults OFF. Missing/disabled → pass-through + admin warning.
 */
import { prisma } from '@/lib/prisma';
import {
  applyProcessingProtection,
  type ProcessingProtectionResult,
} from './processingProtection';
import { roundMoney } from './money';

export const DEFAULT_PROCESSING_POLICY_VERSION = 'pp-v1';

export type ProcessingPolicy = {
  enabled: boolean;
  percentageRate: number;
  fixedFee: number;
  roundingIncrement: number;
  policyVersion: string;
};

export type ProtectedPriceResult = ProcessingProtectionResult & {
  pricingPolicyVersion: string | null;
  /** Observable when config missing/disabled — does not block booking. */
  warning: string | null;
  protected: boolean;
};

const PASS_THROUGH_WARNING =
  'Processing protection is disabled or not configured — customer price equals operational subtotal.';

export function passThroughProtectedPrice(operationalSubtotal: number): ProtectedPriceResult {
  const operational = roundMoney(operationalSubtotal);
  return {
    operationalSubtotal: operational,
    rawProtected: operational,
    customerPrice: operational,
    processingAllowanceEstimated: 0,
    estimatedNetAfterProcessing: operational,
    pricingPolicyVersion: null,
    warning: PASS_THROUGH_WARNING,
    protected: false,
  };
}

export async function loadProcessingPolicy(): Promise<ProcessingPolicy | null> {
  const row = await prisma.adminPlatformSettings.findUnique({
    where: { id: 'default' },
    select: {
      processingProtectionEnabled: true,
      processingPercentageRate: true,
      processingFixedFee: true,
      processingRoundingIncrement: true,
      processingPolicyVersion: true,
    },
  });

  if (!row) return null;

  return {
    enabled: Boolean(row.processingProtectionEnabled),
    percentageRate: row.processingPercentageRate != null ? Number(row.processingPercentageRate) : 0,
    fixedFee: row.processingFixedFee != null ? Number(row.processingFixedFee) : 0,
    roundingIncrement: row.processingRoundingIncrement ?? 5,
    policyVersion: row.processingPolicyVersion?.trim() || DEFAULT_PROCESSING_POLICY_VERSION,
  };
}

/**
 * Apply configured protection to an operational subtotal.
 * Never throws for missing config — pass-through with warning.
 */
export async function protectOperationalPrice(
  operationalSubtotal: number
): Promise<ProtectedPriceResult> {
  const operational = roundMoney(operationalSubtotal);
  if (!(operational > 0)) {
    return passThroughProtectedPrice(0);
  }

  let policy: ProcessingPolicy | null = null;
  try {
    policy = await loadProcessingPolicy();
  } catch {
    return {
      ...passThroughProtectedPrice(operational),
      warning: 'Processing protection settings unavailable — using pass-through pricing.',
    };
  }

  if (!policy || !policy.enabled) {
    return passThroughProtectedPrice(operational);
  }

  // Enabled but incomplete rates → still allow booking with pass-through + warning
  if (policy.percentageRate < 0 || policy.percentageRate >= 1) {
    return {
      ...passThroughProtectedPrice(operational),
      warning: 'Processing protection rate is invalid — using pass-through pricing.',
    };
  }

  try {
    const result = applyProcessingProtection({
      operationalSubtotal: operational,
      percentageRate: policy.percentageRate,
      fixedFee: Math.max(0, policy.fixedFee),
      roundingIncrement: policy.roundingIncrement > 0 ? policy.roundingIncrement : 5,
    });
    return {
      ...result,
      pricingPolicyVersion: policy.policyVersion,
      warning: null,
      protected: true,
    };
  } catch {
    return {
      ...passThroughProtectedPrice(operational),
      warning: 'Processing protection calculation failed — using pass-through pricing.',
    };
  }
}
