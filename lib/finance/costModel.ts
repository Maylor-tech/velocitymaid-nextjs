import { prisma } from '@/lib/prisma';

/**
 * Cost breakdown for jobs
 */
export type CostBreakdown = {
  laborCost: number;
  suppliesCost: number;
  otherCost: number;
  totalCost: number;
};

/**
 * Branch cost configuration
 */
export type BranchCostConfig = {
  laborRate?: number;       // e.g. 0.55 => 55% of revenue
  suppliesRate?: number;    // e.g. 0.05
  otherRate?: number;      // e.g. 0.10
};

/**
 * Default cost rates
 */
const DEFAULT_LABOR_RATE = 0.55;
const DEFAULT_SUPPLIES_RATE = 0.05;
const DEFAULT_OTHER_RATE = 0.10;

/**
 * Compute cost breakdown for a set of jobs
 */
export function computeCostForJobs(args: {
  jobs: { id: string; amount: number }[];
  branchConfig?: BranchCostConfig;
}): CostBreakdown {
  const { jobs, branchConfig } = args;

  // Use branch config or defaults
  const laborRate = branchConfig?.laborRate ?? DEFAULT_LABOR_RATE;
  const suppliesRate = branchConfig?.suppliesRate ?? DEFAULT_SUPPLIES_RATE;
  const otherRate = branchConfig?.otherRate ?? DEFAULT_OTHER_RATE;

  // Calculate total revenue
  const totalRevenue = jobs.reduce((sum, job) => sum + job.amount, 0);

  // Calculate costs
  const laborCost = totalRevenue * laborRate;
  const suppliesCost = totalRevenue * suppliesRate;
  const otherCost = totalRevenue * otherRate;
  const totalCost = laborCost + suppliesCost + otherCost;

  return {
    laborCost: Math.round(laborCost * 100) / 100,
    suppliesCost: Math.round(suppliesCost * 100) / 100,
    otherCost: Math.round(otherCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Get branch-specific cost configuration
 * 
 * Checks for BranchSettings or JSON column with financeConfig.
 * If not found, returns default rates.
 */
export async function getBranchCostConfig(branchId: string): Promise<BranchCostConfig> {
  try {
    // Check if Branch model has a settings or config field
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        // If there's a settings JSON field, we'd access it here
        // For now, we'll check BranchPayoutRules as a proxy
      },
    });

    if (!branch) {
      return {};
    }

    // Check BranchPayoutRules for any cost-related settings
    const payoutRules = await prisma.branchPayoutRules.findUnique({
      where: { branchId },
    });

    // If payout rules exist, we could derive cost rates from them
    // For now, return empty to use defaults
    // TODO: If schema adds financeConfig JSON field, parse it here

    return {};
  } catch (error) {
    console.error('Error fetching branch cost config:', error);
    return {};
  }
}















