/**
 * Cleaner Incentive Engine
 * 
 * Calculates performance tiers and bonuses based on cleaner metrics
 */

import type { IncentiveTier } from './incentiveData';

export interface PerformanceMetrics {
  totalJobs: number;
  avgRating: number; // 1-5
  onTimeRate: number; // Percentage
  complaintRate: number; // Percentage
}

export interface TierRequirements {
  avgRating: number;
  onTimeRate: number;
  complaintRate: number;
  totalJobs: number;
}

export interface TierInfo {
  tier: IncentiveTier;
  bonusPerJob: number;
  requirements: TierRequirements;
  nextTier?: IncentiveTier;
  nextTierRequirements?: TierRequirements;
}

/**
 * Calculate performance tier based on metrics
 */
export function calculateTier(metrics: PerformanceMetrics): IncentiveTier {
  const { totalJobs, avgRating, onTimeRate, complaintRate } = metrics;

  // Must have at least 3 jobs to qualify
  if (totalJobs < 3) {
    return 'Bronze';
  }

  // Platinum tier
  if (
    avgRating >= 4.8 &&
    onTimeRate >= 90 &&
    complaintRate < 5 &&
    totalJobs >= 15
  ) {
    return 'Platinum';
  }

  // Gold tier
  if (
    avgRating >= 4.5 &&
    onTimeRate >= 85 &&
    complaintRate < 10 &&
    totalJobs >= 10
  ) {
    return 'Gold';
  }

  // Silver tier
  if (
    avgRating >= 4.2 &&
    onTimeRate >= 80 &&
    complaintRate < 15 &&
    totalJobs >= 6
  ) {
    return 'Silver';
  }

  // Bronze tier (default for anyone with 3+ jobs)
  return 'Bronze';
}

/**
 * Calculate bonus amount based on tier and total jobs
 */
export function calculateBonus(tier: IncentiveTier, totalJobs: number): number {
  const bonusPerJob: Record<IncentiveTier, number> = {
    Platinum: 7.0,
    Gold: 5.0,
    Silver: 3.0,
    Bronze: 1.5,
  };

  const bonus = bonusPerJob[tier] * totalJobs;
  return Math.round(bonus * 100) / 100; // Round to 2 decimals
}

/**
 * Get tier information including requirements
 */
export function getTierInfo(tier: IncentiveTier): TierInfo {
  const tierRequirements: Record<IncentiveTier, TierRequirements> = {
    Platinum: {
      avgRating: 4.8,
      onTimeRate: 90,
      complaintRate: 5,
      totalJobs: 15,
    },
    Gold: {
      avgRating: 4.5,
      onTimeRate: 85,
      complaintRate: 10,
      totalJobs: 10,
    },
    Silver: {
      avgRating: 4.2,
      onTimeRate: 80,
      complaintRate: 15,
      totalJobs: 6,
    },
    Bronze: {
      avgRating: 0,
      onTimeRate: 0,
      complaintRate: 100,
      totalJobs: 3,
    },
  };

  const bonusPerJob: Record<IncentiveTier, number> = {
    Platinum: 7.0,
    Gold: 5.0,
    Silver: 3.0,
    Bronze: 1.5,
  };

  const tierOrder: IncentiveTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentIndex = tierOrder.indexOf(tier);
  const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : undefined;

  return {
    tier,
    bonusPerJob: bonusPerJob[tier],
    requirements: tierRequirements[tier],
    nextTier,
    nextTierRequirements: nextTier ? tierRequirements[nextTier] : undefined,
  };
}

/**
 * Calculate what's needed to reach next tier
 */
export function calculateNextTierRequirements(
  currentMetrics: PerformanceMetrics,
  currentTier: IncentiveTier
): {
  nextTier: IncentiveTier | null;
  requirements: {
    jobsNeeded: number;
    ratingNeeded: number;
    onTimeNeeded: number;
    complaintReduction: number;
  } | null;
} {
  const tierInfo = getTierInfo(currentTier);
  
  if (!tierInfo.nextTier || !tierInfo.nextTierRequirements) {
    return {
      nextTier: null,
      requirements: null,
    };
  }

  const next = tierInfo.nextTierRequirements;
  const current = currentMetrics;

  return {
    nextTier: tierInfo.nextTier,
    requirements: {
      jobsNeeded: Math.max(0, next.totalJobs - current.totalJobs),
      ratingNeeded: Math.max(0, next.avgRating - current.avgRating),
      onTimeNeeded: Math.max(0, next.onTimeRate - current.onTimeRate),
      complaintReduction: Math.max(0, current.complaintRate - next.complaintRate),
    },
  };
}

/**
 * Get tier index for charting (Platinum = 4, Gold = 3, Silver = 2, Bronze = 1)
 */
export function getTierIndex(tier: IncentiveTier): number {
  const tierMap: Record<IncentiveTier, number> = {
    Platinum: 4,
    Gold: 3,
    Silver: 2,
    Bronze: 1,
  };
  return tierMap[tier];
}




