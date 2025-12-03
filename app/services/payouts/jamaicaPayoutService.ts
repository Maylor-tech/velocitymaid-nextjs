/**
 * Jamaica Payout Service
 * 
 * Handles payout calculations and management for Jamaica (JMD) operations
 * Only applies when branch.country = "JM"
 */

import { prisma } from '@/lib/prisma';
import { isCleanerEligibleForPayout } from '@/utils/trainingEligibility';

// Cleaner pay rates by service type (as percentage of job price)
const CLEANER_PAY_RATES: Record<string, number> = {
  'deep': 0.60,        // 60% for Deep Clean
  'basic': 0.55,       // 55% for Standard Clean
  'moveInOut': 0.65,  // 65% for Move In/Out
  'DEEP_CLEAN': 0.60,
  'STANDARD_CLEAN': 0.55,
  'MOVE_IN_OUT': 0.65,
};

interface EarningsResult {
  totalEarnings: number;
  jobCount: number;
  jobs: Array<{
    id: string;
    serviceType: string;
    totalPrice: number;
    cleanerEarnings: number;
    completedAt: Date;
  }>;
}

/**
 * Calculate cleaner earnings for a given period
 * Only includes completed jobs in Jamaica branches with JMD currency
 */
export async function calculateCleanerEarnings(
  cleanerId: string,
  branchId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<EarningsResult> {
  // Verify branch is Jamaica
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { country: true, currency: true },
  });

  if (!branch || branch.country !== 'JM' || branch.currency !== 'JMD') {
    throw new Error('Payout calculation only available for Jamaica (JM) branches with JMD currency');
  }

  // Get all completed jobs for this cleaner in this branch within the period
  const jobs = await prisma.job.findMany({
    where: {
      assignedCleanerId: cleanerId,
      branchId: branchId,
      status: 'completed',
      currency: 'JMD',
      completedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    select: {
      id: true,
      serviceType: true,
      totalPrice: true,
      completedAt: true,
    },
  });

  let totalEarnings = 0;
  const jobDetails = jobs.map((job) => {
    // Determine pay rate based on service type
    const serviceType = job.serviceType?.toLowerCase() || '';
    let payRate = 0.55; // Default 55%

    // Match service type to pay rate
    if (serviceType.includes('deep')) {
      payRate = CLEANER_PAY_RATES['deep'];
    } else if (serviceType.includes('move') || serviceType.includes('in') || serviceType.includes('out')) {
      payRate = CLEANER_PAY_RATES['moveInOut'];
    } else {
      payRate = CLEANER_PAY_RATES['basic'];
    }

    // Calculate cleaner earnings for this job
    const jobPrice = Number(job.totalPrice) || 0;
    const cleanerEarnings = jobPrice * payRate;

    totalEarnings += cleanerEarnings;

    return {
      id: job.id,
      serviceType: job.serviceType || 'Unknown',
      totalPrice: jobPrice,
      cleanerEarnings,
      completedAt: job.completedAt!,
    };
  });

  return {
    totalEarnings,
    jobCount: jobs.length,
    jobs: jobDetails,
  };
}

/**
 * Create a payout for a cleaner
 */
export async function createPayout(
  cleanerId: string,
  branchId: string,
  periodStart: Date,
  periodEnd: Date,
  notes?: string
) {
  // Verify branch is Jamaica
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { country: true, currency: true },
  });

  if (!branch || branch.country !== 'JM' || branch.currency !== 'JMD') {
    throw new Error('Payouts only available for Jamaica (JM) branches with JMD currency');
  }

  // Check training eligibility
  const eligibility = await isCleanerEligibleForPayout(cleanerId, branchId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || 'Training not completed. Please complete all training modules to receive payouts.');
  }

  // Calculate earnings
  const earnings = await calculateCleanerEarnings(cleanerId, branchId, periodStart, periodEnd);

  if (earnings.totalEarnings <= 0) {
    throw new Error('No earnings found for this period');
  }

  // Create payout record
  const payout = await prisma.jamaicaPayout.create({
    data: {
      cleanerId,
      branchId,
      periodStart,
      periodEnd,
      totalAmount: earnings.totalEarnings,
      currency: 'JMD',
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      notes: notes || null,
    },
    include: {
      cleaner: {
        select: { id: true, name: true, email: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
  });

  return payout;
}

/**
 * Mark payout as approved
 */
export async function markPayoutApproved(payoutId: string) {
  const payout = await prisma.jamaicaPayout.update({
    where: { id: payoutId },
    data: { status: 'APPROVED' },
    include: {
      cleaner: {
        select: { id: true, name: true, email: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
  });

  return payout;
}

/**
 * Mark payout as paid
 */
export async function markPayoutPaid(payoutId: string) {
  const payout = await prisma.jamaicaPayout.update({
    where: { id: payoutId },
    data: { status: 'PAID' },
    include: {
      cleaner: {
        select: { id: true, name: true, email: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
  });

  return payout;
}

/**
 * Get cleaner's payment method
 */
export async function getCleanerPaymentMethod(cleanerId: string) {
  const paymentMethod = await prisma.jamaicaPaymentMethod.findUnique({
    where: { cleanerId },
  });

  return paymentMethod;
}

/**
 * Update or create cleaner payment method
 */
export async function updateCleanerPaymentMethod(
  cleanerId: string,
  data: {
    bankName?: string;
    accountNumber?: string;
    accountType?: string;
    whatsappNumber?: string;
  }
) {
  const paymentMethod = await prisma.jamaicaPaymentMethod.upsert({
    where: { cleanerId },
    create: {
      cleanerId,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      accountType: data.accountType || null,
      whatsappNumber: data.whatsappNumber || null,
    },
    update: {
      ...(data.bankName !== undefined && { bankName: data.bankName || null }),
      ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber || null }),
      ...(data.accountType !== undefined && { accountType: data.accountType || null }),
      ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber || null }),
    },
  });

  return paymentMethod;
}

/**
 * Get all payouts for a branch (Jamaica only)
 */
export async function getBranchPayouts(
  branchId: string,
  status?: string
) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { country: true },
  });

  if (!branch || branch.country !== 'JM') {
    throw new Error('Payouts only available for Jamaica branches');
  }

  const payouts = await prisma.jamaicaPayout.findMany({
    where: {
      branchId,
      ...(status && { status }),
    },
    include: {
      cleaner: {
        select: { id: true, name: true, email: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return payouts;
}

