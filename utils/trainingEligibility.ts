/**
 * Training Eligibility Utility
 * 
 * Checks if a cleaner is eligible for job assignments based on training status
 */

import { prisma } from '../lib/prisma';

/**
 * Check if cleaner has passed training (for Jamaica branch)
 */
export async function isCleanerTrainingEligible(cleanerId: string): Promise<{
  eligible: boolean;
  reason?: string;
  trainingStatus?: string;
}> {
  try {
    // Get cleaner with branch info
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId },
      include: {
        primaryBranch: {
          select: {
            id: true,
            country: true,
            slug: true,
          },
        },
        trainingStatus: true,
      },
    });

    if (!cleaner) {
      return {
        eligible: false,
        reason: 'Cleaner not found',
      };
    }

    // Check if cleaner is in Jamaica branch
    const isJamaicaBranch =
      cleaner.primaryBranch?.country === 'Jamaica' ||
      cleaner.primaryBranch?.country === 'JM' ||
      cleaner.primaryBranch?.slug === 'port-antonio';

    // If not Jamaica branch, training is not required
    if (!isJamaicaBranch) {
      return {
        eligible: true,
        trainingStatus: 'NOT_REQUIRED',
      };
    }

    // For Jamaica branch, check training status
    const trainingStatus = cleaner.trainingStatus;

    if (!trainingStatus) {
      return {
        eligible: false,
        reason: 'Training not started. Please complete your training modules before accepting jobs.',
        trainingStatus: 'NOT_STARTED',
      };
    }

    if (trainingStatus.overallStatus !== 'PASSED') {
      return {
        eligible: false,
        reason: `Training ${trainingStatus.overallStatus.toLowerCase().replace('_', ' ')}. Please complete all training modules before accepting jobs.`,
        trainingStatus: trainingStatus.overallStatus,
      };
    }

    return {
      eligible: true,
      trainingStatus: 'PASSED',
    };
  } catch (error: any) {
    console.error('Error checking training eligibility:', error);
    // Fail open for U.S. branches, fail closed for Jamaica
    return {
      eligible: false,
      reason: 'Unable to verify training status. Please contact support.',
    };
  }
}

/**
 * Check if cleaner is eligible for payouts (Jamaica only)
 */
export async function isCleanerEligibleForPayout(cleanerId: string, branchId: string): Promise<{
  eligible: boolean;
  reason?: string;
}> {
  try {
    // Check if branch is Jamaica
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { country: true, currency: true },
    });

    if (!branch) {
      return {
        eligible: false,
        reason: 'Branch not found',
      };
    }

    const isJamaicaBranch = branch.country === 'Jamaica' || branch.country === 'JM' || branch.currency === 'JMD';

    // If not Jamaica branch, no training requirement
    if (!isJamaicaBranch) {
      return {
        eligible: true,
      };
    }

    // For Jamaica, check training status
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    if (!trainingStatus) {
      return {
        eligible: false,
        reason: 'Training not started. Please complete your training modules to receive payouts.',
      };
    }

    if (trainingStatus.overallStatus !== 'PASSED') {
      return {
        eligible: false,
        reason: `Training ${trainingStatus.overallStatus.toLowerCase().replace('_', ' ')}. Please complete all training modules to receive payouts.`,
      };
    }

    return {
      eligible: true,
    };
  } catch (error: any) {
    console.error('Error checking payout eligibility:', error);
    return {
      eligible: false,
      reason: 'Unable to verify training status. Please contact support.',
    };
  }
}


