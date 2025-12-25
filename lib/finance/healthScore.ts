/**
 * Inputs for calculating branch financial health score
 */
export type BranchHealthInputs = {
  profitMargin: number;         // 0–1 (e.g., 0.25 = 25%)
  revenueTrendSlope: number;    // positive = growing, negative = shrinking
  unassignedRate: number;       // 0–1 (unassigned jobs / total jobs)
  complaintRate: number;        // 0–1 (complaints / jobs)
  payoutToRevenueRatio: number; // 0–1 (total payouts / revenue)
};

/**
 * Branch financial health score result
 */
export type BranchHealthScore = {
  score: number;               // 0–100
  level: 'CRITICAL' | 'WEAK' | 'STABLE' | 'HEALTHY' | 'EXCELLENT';
  recommendations: string[];
};

/**
 * Calculate branch financial health score
 */
export function calculateBranchHealthScore(
  inputs: BranchHealthInputs
): BranchHealthScore {
  let score = 50; // Start from 50

  const { profitMargin, revenueTrendSlope, unassignedRate, complaintRate, payoutToRevenueRatio } = inputs;

  // Profit margin scoring
  if (profitMargin < 0) {
    score -= 20;
  } else if (profitMargin >= 0 && profitMargin < 0.1) {
    score -= 10;
  } else if (profitMargin >= 0.1 && profitMargin < 0.2) {
    score += 0;
  } else if (profitMargin >= 0.2 && profitMargin < 0.3) {
    score += 10;
  } else if (profitMargin >= 0.3) {
    score += 20;
  }

  // Revenue trend scoring
  if (revenueTrendSlope < -0.1) {
    score -= 10; // Declining significantly
  } else if (revenueTrendSlope >= -0.1 && revenueTrendSlope < 0.05) {
    score += 0; // Stable or slight decline
  } else if (revenueTrendSlope >= 0.05) {
    score += 10; // Growing
  }

  // Unassigned rate scoring
  if (unassignedRate >= 0.2) {
    score -= 15; // High unassigned rate
  } else if (unassignedRate >= 0.1 && unassignedRate < 0.2) {
    score -= 5;
  } else if (unassignedRate < 0.1) {
    score += 5; // Low unassigned rate is good
  }

  // Complaint rate scoring
  if (complaintRate >= 0.1) {
    score -= 20; // High complaint rate
  } else if (complaintRate >= 0.05 && complaintRate < 0.1) {
    score -= 10;
  } else if (complaintRate < 0.05) {
    score += 5; // Low complaint rate is good
  }

  // Payout to revenue ratio scoring
  if (payoutToRevenueRatio >= 0.7) {
    score -= 10; // Very high payout ratio
  } else if (payoutToRevenueRatio >= 0.5 && payoutToRevenueRatio < 0.7) {
    score += 0; // Moderate
  } else if (payoutToRevenueRatio >= 0.3 && payoutToRevenueRatio < 0.5) {
    score += 5; // Good balance
  } else if (payoutToRevenueRatio < 0.3) {
    score += 5; // Low payout ratio (may indicate underpayment, but good for margins)
  }

  // Clamp score between 0–100
  score = Math.max(0, Math.min(100, score));

  // Map to level
  let level: BranchHealthScore['level'];
  if (score >= 0 && score <= 39) {
    level = 'CRITICAL';
  } else if (score >= 40 && score <= 54) {
    level = 'WEAK';
  } else if (score >= 55 && score <= 69) {
    level = 'STABLE';
  } else if (score >= 70 && score <= 84) {
    level = 'HEALTHY';
  } else {
    level = 'EXCELLENT';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (profitMargin < 0.1) {
    recommendations.push('Increase prices or reduce costs to improve profit margins.');
  }

  if (revenueTrendSlope < -0.05) {
    recommendations.push('Revenue is declining — investigate market conditions and pricing strategy.');
  }

  if (unassignedRate >= 0.1) {
    recommendations.push('Reduce unassigned jobs to improve efficiency and customer satisfaction.');
  }

  if (complaintRate >= 0.05) {
    recommendations.push('Investigate high complaint rates and strengthen quality control.');
  }

  if (payoutToRevenueRatio >= 0.7) {
    recommendations.push('Payout ratio is high — review cleaner payout configuration.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Branch is performing well. Continue monitoring key metrics.');
  }

  return {
    score: Math.round(score),
    level,
    recommendations: recommendations.slice(0, 4), // Max 4 recommendations
  };
}

/**
 * Calculate revenue trend slope from daily revenue data
 * Uses simple linear regression
 */
export function calculateRevenueTrendSlope(
  revenueByDay: Array<{ date: string; revenue: number }>
): number {
  if (revenueByDay.length < 2) {
    return 0;
  }

  // Simple linear regression: y = mx + b
  const n = revenueByDay.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  revenueByDay.forEach((point, index) => {
    const x = index; // Day index
    const y = point.revenue;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Normalize slope by average revenue to get percentage change per day
  const avgRevenue = sumY / n;
  if (avgRevenue === 0) return 0;

  return slope / avgRevenue; // Return as a ratio (e.g., 0.05 = 5% growth per day)
}
















