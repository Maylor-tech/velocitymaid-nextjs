import { prisma } from '../prisma';

/**
 * Calculate cleaner share for a job
 * 
 * Uses branch payout rules if available, otherwise defaults to 55% of job amount
 */
export async function calculateCleanerShare(job: {
  id: string;
  totalPrice: number | null;
  branchId: string;
  assignedCleanerId: string | null;
}): Promise<number> {
  if (!job.totalPrice || !job.assignedCleanerId) {
    return 0;
  }

  const amount = Number(job.totalPrice);

  try {
    // Check for branch-specific payout rules
    const payoutRules = await prisma.branchPayoutRules.findUnique({
      where: { branchId: job.branchId },
    });

    if (payoutRules) {
      // Use base rate from payout rules
      if (payoutRules.baseRateType === 'PERCENTAGE') {
        const percentage = Number(payoutRules.baseRateValue) / 100;
        return Math.round(amount * percentage * 100) / 100;
      } else if (payoutRules.baseRateType === 'FIXED') {
        // Fixed rate per job (less common, but handle it)
        return Number(payoutRules.baseRateValue);
      }
    }

    // Default: 55% of job amount
    const DEFAULT_CLEANER_SHARE_RATE = 0.55;
    return Math.round(amount * DEFAULT_CLEANER_SHARE_RATE * 100) / 100;
  } catch (error) {
    console.error('Error calculating cleaner share:', error);
    // Fallback to default
    const DEFAULT_CLEANER_SHARE_RATE = 0.55;
    return Math.round(amount * DEFAULT_CLEANER_SHARE_RATE * 100) / 100;
  }
}

/**
 * Apply bonuses and penalties for a cleaner in a date range
 * 
 * Returns bonuses and penalties based on existing models.
 * If no incentive/penalty models exist, returns 0 for both.
 */
export async function applyBonusesAndPenalties(
  cleanerId: string,
  range: { from: Date; to: Date }
): Promise<{ bonuses: number; penalties: number }> {
  try {
    // Check for incentive/bonus models
    // TODO: If Incentive, Bonus, or similar models exist, query them here
    // For now, return 0

    // Check for complaint/penalty models
    // TODO: If Complaint, Penalty, or similar models exist, query them here
    // For now, return 0

    return {
      bonuses: 0,
      penalties: 0,
    };
  } catch (error) {
    console.error('Error calculating bonuses/penalties:', error);
    return {
      bonuses: 0,
      penalties: 0,
    };
  }
}

/**
 * Get all completed and payable jobs for a cleaner in a date range
 */
export async function getPayableJobs(
  cleanerId: string,
  branchId: string,
  range: { from: Date; to: Date }
): Promise<Array<{
  id: string;
  totalPrice: number | null;
  completedAt: Date | null;
  branchId: string;
}>> {
  const jobs = await prisma.job.findMany({
    where: {
      assignedCleanerId: cleanerId,
      branchId,
      status: 'completed',
      completedAt: {
        gte: range.from,
        lte: range.to,
      },
      // Exclude cancelled/refunded jobs
      // TODO: If there's a refunded flag or status, filter it out
    },
    select: {
      id: true,
      totalPrice: true,
      completedAt: true,
      branchId: true,
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  return jobs;
}
















