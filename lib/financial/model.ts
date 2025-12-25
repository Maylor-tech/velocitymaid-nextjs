/**
 * Financial Engine - Core Model
 * 
 * Implements Option B: Intermediate Model for financial calculations
 */

export type CleanerLevel = 1 | 2 | 3 | 4;

export interface JobFinancialInput {
  jobId: string;
  branchId: string;
  cleanerId: string | null;
  totalPrice: number;
  completedAt: Date | null;
  scheduledStart: Date | null;
  startedAt: Date | null;
  distanceMiles?: number | null;
  rating?: number | null;
  hasUnresolvedComplaint?: boolean;
  status: string;
  cleanerLevel?: CleanerLevel | null;
}

export interface JobFinancialBreakdown {
  jobId: string;
  branchId: string;
  cleanerId: string | null;
  grossRevenue: number;
  stripeFee: number;
  suppliesCost: number;
  travelCost: number;
  overheadCost: number;
  netLaborRevenue: number;
  cleanerSharePercent: number;
  baseCleanerShare: number;
  bonusAmount: number;
  penaltyAmount: number;
  cleanerEarnings: number;
  branchProfit: number;
  branchMargin: number; // 0–1
}

/**
 * Get cleaner share percentage based on level
 * Level 1: 45%, Level 2: 50%, Level 3: 55%, Level 4: 60%
 * Default: 50%
 */
export function getCleanerSharePercent(level?: CleanerLevel | null): number {
  if (!level) return 50;
  
  switch (level) {
    case 1:
      return 45;
    case 2:
      return 50;
    case 3:
      return 55;
    case 4:
      return 60;
    default:
      return 50;
  }
}

/**
 * Calculate travel cost
 * If distance > 5 miles: $6
 * Otherwise: random $2-4 for demo (or 0 if no distance)
 */
function calculateTravelCost(distanceMiles?: number | null): number {
  if (!distanceMiles || distanceMiles <= 0) {
    // For demo: random $2-4 if no distance provided
    // In production, this would be 0 or calculated from address
    return Math.random() * 2 + 2; // $2-4
  }
  
  if (distanceMiles > 5) {
    return 6;
  }
  
  // For distances <= 5 miles, use a smaller random amount
  return Math.random() * 2 + 1; // $1-3
}

/**
 * Calculate job financial breakdown
 * 
 * Pure function that takes job input and returns complete financial breakdown
 */
export function calculateJobCosts(input: JobFinancialInput): JobFinancialBreakdown {
  const {
    jobId,
    branchId,
    cleanerId,
    totalPrice,
    completedAt,
    scheduledStart,
    startedAt,
    distanceMiles,
    rating,
    hasUnresolvedComplaint = false,
    status,
    cleanerLevel,
  } = input;

  // Ensure totalPrice is valid
  const grossRevenue = totalPrice > 0 ? totalPrice : 0;

  // Calculate costs
  const stripeFee = Math.round(grossRevenue * 0.03 * 100) / 100; // 3% Stripe fee
  const suppliesCost = 12; // Fixed $12 per job
  const travelCost = Math.round(calculateTravelCost(distanceMiles) * 100) / 100;
  const overheadCost = Math.round(grossRevenue * 0.15 * 100) / 100; // 15% overhead

  // Net labor revenue (what's left after direct costs)
  const netLaborRevenue = Math.max(
    0,
    grossRevenue - stripeFee - suppliesCost - travelCost - overheadCost
  );

  // Get cleaner share percentage based on level
  const cleanerSharePercent = getCleanerSharePercent(cleanerLevel);

  // Base cleaner share
  const baseCleanerShare = Math.round(
    netLaborRevenue * (cleanerSharePercent / 100) * 100
  ) / 100;

  // Calculate bonuses
  let bonusAmount = 0;

  // Rating >= 4.8 → +$5
  if (rating !== null && rating !== undefined && rating >= 4.8) {
    bonusAmount += 5;
  }

  // Started on time (within 10 minutes of scheduled start) → +$3
  if (
    scheduledStart &&
    startedAt &&
    completedAt &&
    startedAt.getTime() <= scheduledStart.getTime() + 10 * 60 * 1000
  ) {
    bonusAmount += 3;
  }

  // Calculate penalties
  let penaltyAmount = 0;

  // Unresolved complaint → -$10
  if (hasUnresolvedComplaint) {
    penaltyAmount += 10;
  }

  // Cancelled by cleaner → -$15 and cleaner earnings = 0
  const isCancelledByCleaner = status === 'CANCELLED_BY_CLEANER' || status === 'cancelled_by_cleaner';
  
  if (isCancelledByCleaner) {
    penaltyAmount += 15;
    // Cleaner earnings will be set to 0 below
  }

  // Calculate cleaner earnings
  // If cancelled by cleaner, earnings = 0 (but branch still shows loss)
  const cleanerEarnings = isCancelledByCleaner
    ? 0
    : Math.max(0, Math.round((baseCleanerShare + bonusAmount - penaltyAmount) * 100) / 100);

  // Calculate branch profit
  const branchProfit = Math.round(
    (grossRevenue - stripeFee - suppliesCost - travelCost - overheadCost - cleanerEarnings) * 100
  ) / 100;

  // Calculate branch margin (0-1)
  const branchMargin = grossRevenue > 0 ? Math.max(0, Math.min(1, branchProfit / grossRevenue)) : 0;

  // Ensure no NaN values
  const safeValue = (value: number): number => {
    if (isNaN(value) || !isFinite(value)) return 0;
    return value;
  };

  return {
    jobId,
    branchId,
    cleanerId,
    grossRevenue: safeValue(grossRevenue),
    stripeFee: safeValue(stripeFee),
    suppliesCost: safeValue(suppliesCost),
    travelCost: safeValue(travelCost),
    overheadCost: safeValue(overheadCost),
    netLaborRevenue: safeValue(netLaborRevenue),
    cleanerSharePercent,
    baseCleanerShare: safeValue(baseCleanerShare),
    bonusAmount: safeValue(bonusAmount),
    penaltyAmount: safeValue(penaltyAmount),
    cleanerEarnings: safeValue(cleanerEarnings),
    branchProfit: safeValue(branchProfit),
    branchMargin: safeValue(branchMargin),
  };
}
















