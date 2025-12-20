/**
 * Financial Engine - Aggregation Helpers
 * 
 * Functions to aggregate financial breakdowns by branch and cleaner
 */

import { JobFinancialBreakdown } from './model';

export interface BranchFinancialTotals {
  totalGrossRevenue: number;
  totalStripeFees: number;
  totalSuppliesCost: number;
  totalTravelCost: number;
  totalOverheadCost: number;
  totalCleanerEarnings: number;
  totalBranchProfit: number;
  branchMargin: number; // 0-1
  totalJobs: number;
}

export interface CleanerEarningsSummary {
  cleanerId: string;
  jobsCompleted: number;
  earnings: number;
  bonuses: number;
  penalties: number;
  profitContribution: number; // Branch profit from this cleaner's jobs
  avgMargin: number; // Average branch margin for this cleaner's jobs
}

/**
 * Aggregate financial breakdowns for a branch
 */
export function aggregateBranchFinancials(
  breakdowns: JobFinancialBreakdown[]
): BranchFinancialTotals {
  if (breakdowns.length === 0) {
    return {
      totalGrossRevenue: 0,
      totalStripeFees: 0,
      totalSuppliesCost: 0,
      totalTravelCost: 0,
      totalOverheadCost: 0,
      totalCleanerEarnings: 0,
      totalBranchProfit: 0,
      branchMargin: 0,
      totalJobs: 0,
    };
  }

  const totals = breakdowns.reduce(
    (acc, breakdown) => {
      return {
        totalGrossRevenue: acc.totalGrossRevenue + breakdown.grossRevenue,
        totalStripeFees: acc.totalStripeFees + breakdown.stripeFee,
        totalSuppliesCost: acc.totalSuppliesCost + breakdown.suppliesCost,
        totalTravelCost: acc.totalTravelCost + breakdown.travelCost,
        totalOverheadCost: acc.totalOverheadCost + breakdown.overheadCost,
        totalCleanerEarnings: acc.totalCleanerEarnings + breakdown.cleanerEarnings,
        totalBranchProfit: acc.totalBranchProfit + breakdown.branchProfit,
      };
    },
    {
      totalGrossRevenue: 0,
      totalStripeFees: 0,
      totalSuppliesCost: 0,
      totalTravelCost: 0,
      totalOverheadCost: 0,
      totalCleanerEarnings: 0,
      totalBranchProfit: 0,
    }
  );

  // Round all values to 2 decimal places
  const roundedTotals = {
    totalGrossRevenue: Math.round(totals.totalGrossRevenue * 100) / 100,
    totalStripeFees: Math.round(totals.totalStripeFees * 100) / 100,
    totalSuppliesCost: Math.round(totals.totalSuppliesCost * 100) / 100,
    totalTravelCost: Math.round(totals.totalTravelCost * 100) / 100,
    totalOverheadCost: Math.round(totals.totalOverheadCost * 100) / 100,
    totalCleanerEarnings: Math.round(totals.totalCleanerEarnings * 100) / 100,
    totalBranchProfit: Math.round(totals.totalBranchProfit * 100) / 100,
  };

  // Calculate overall branch margin
  const branchMargin =
    roundedTotals.totalGrossRevenue > 0
      ? Math.max(0, Math.min(1, roundedTotals.totalBranchProfit / roundedTotals.totalGrossRevenue))
      : 0;

  return {
    ...roundedTotals,
    branchMargin: Math.round(branchMargin * 10000) / 10000, // Keep precision for margin
    totalJobs: breakdowns.length,
  };
}

/**
 * Aggregate cleaner earnings from financial breakdowns
 * Returns a map of cleanerId -> earnings summary
 */
export function aggregateCleanerEarnings(
  breakdowns: JobFinancialBreakdown[]
): Map<string, CleanerEarningsSummary> {
  const cleanerMap = new Map<string, CleanerEarningsSummary>();

  for (const breakdown of breakdowns) {
    // Skip jobs without a cleaner
    if (!breakdown.cleanerId) continue;

    const existing = cleanerMap.get(breakdown.cleanerId);

    if (existing) {
      existing.jobsCompleted += 1;
      existing.earnings += breakdown.cleanerEarnings;
      existing.bonuses += breakdown.bonusAmount;
      existing.penalties += breakdown.penaltyAmount;
      existing.profitContribution += breakdown.branchProfit;
      // Recalculate average margin
      existing.avgMargin =
        existing.profitContribution / (existing.jobsCompleted * breakdown.grossRevenue || 1);
    } else {
      cleanerMap.set(breakdown.cleanerId, {
        cleanerId: breakdown.cleanerId,
        jobsCompleted: 1,
        earnings: breakdown.cleanerEarnings,
        bonuses: breakdown.bonusAmount,
        penalties: breakdown.penaltyAmount,
        profitContribution: breakdown.branchProfit,
        avgMargin: breakdown.branchMargin,
      });
    }
  }

  // Round all values in the map
  const cleanerIds = Array.from(cleanerMap.keys());
  for (const cleanerId of cleanerIds) {
    const summary = cleanerMap.get(cleanerId);
    if (summary) {
      cleanerMap.set(cleanerId, {
        ...summary,
        earnings: Math.round(summary.earnings * 100) / 100,
        bonuses: Math.round(summary.bonuses * 100) / 100,
        penalties: Math.round(summary.penalties * 100) / 100,
        profitContribution: Math.round(summary.profitContribution * 100) / 100,
        avgMargin: Math.round(summary.avgMargin * 10000) / 10000,
      });
    }
  }

  return cleanerMap;
}

/**
 * Convert cleaner earnings map to array, sorted by earnings (descending)
 */
export function cleanerEarningsToArray(
  earningsMap: Map<string, CleanerEarningsSummary>
): CleanerEarningsSummary[] {
  const values: CleanerEarningsSummary[] = [];
  const keys = Array.from(earningsMap.keys());
  for (const key of keys) {
    const value = earningsMap.get(key);
    if (value) {
      values.push(value);
    }
  }
  return values.sort((a, b) => b.earnings - a.earnings);
}

