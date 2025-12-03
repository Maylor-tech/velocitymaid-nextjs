/**
 * Payout Calculation Engine
 * 
 * Calculates cleaner earnings from jobs and bonuses
 */

import Stripe from 'stripe';
import type { CleanerJobWithTimestamps } from './cleanerScorecardQueries';

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export interface JobEarnings {
  jobId: string;
  serviceType: string;
  completedAt: string;
  baseEarnings: number;
}

export interface PayoutCalculation {
  totalJobs: number;
  baseEarnings: number;
  bonusEarnings: number;
  deductions: number;
  netPayout: number;
  jobs: JobEarnings[];
}

/**
 * Base pay rates per service type
 */
const BASE_PAY_RATES: Record<string, number> = {
  basic: 50.0,
  deep: 80.0,
  moveInOut: 110.0,
};

/**
 * Get cleaner jobs for a specific period
 */
export async function getCleanerJobsForPeriod(
  cleanerId: string,
  cleanerPhone: string,
  startDate: string,
  endDate: string
): Promise<CleanerJobWithTimestamps[]> {
  const stripe = getStripe();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Fetch all checkout sessions
  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  const jobs: CleanerJobWithTimestamps[] = [];

  for (const session of sessions.data) {
    const metadata = session.metadata || {};
    
    // Check if assigned to this cleaner
    if (metadata.assignedCleanerPhone !== cleanerPhone && metadata.assignedCleanerId !== cleanerId) {
      continue;
    }

    // Check if completed
    if (metadata.completed !== 'true') {
      continue;
    }

    // Check if within date range
    const completedAt = metadata.completedAt;
    if (!completedAt) {
      continue;
    }

    const completedDate = new Date(completedAt);
    if (completedDate < start || completedDate > end) {
      continue;
    }

    // Convert to CleanerJobWithTimestamps format
    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

    jobs.push({
      id: session.id,
      sessionId: session.id,
      customerName,
      preferredDate: metadata.preferredDate || '',
      preferredTime: metadata.preferredTime || '',
      serviceLocation: (metadata.serviceLocation as 'new_jersey' | 'vermont') || 'new_jersey',
      status: 'completed',
      assignedCleanerId: cleanerId,
      serviceType: metadata.serviceType || 'basic',
      completedAt,
      createdAt: metadata.createdAt || session.created.toString(),
      onTheWayAt: metadata.onTheWayAt || undefined,
    });
  }

  return jobs;
}

/**
 * Calculate base earnings from jobs
 */
export function calculateBaseEarnings(jobs: CleanerJobWithTimestamps[]): {
  total: number;
  jobEarnings: JobEarnings[];
} {
  const jobEarnings: JobEarnings[] = [];
  let total = 0;

  for (const job of jobs) {
    const serviceType = job.serviceType || 'basic';
    const rate = BASE_PAY_RATES[serviceType] || BASE_PAY_RATES.basic;
    
    jobEarnings.push({
      jobId: job.id,
      serviceType,
      completedAt: job.completedAt || job.preferredDate,
      baseEarnings: rate,
    });

    total += rate;
  }

  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimals
    jobEarnings,
  };
}

/**
 * Get bonus earnings for a period
 */
export function getBonusEarnings(
  cleanerId: string,
  periodStart: string,
  periodEnd: string
): number {
  // Import incentive data functions
  // Using dynamic import to avoid circular dependencies
  const incentiveData = require('./incentiveData');
  const incentives = incentiveData.getIncentivesByPeriod(periodStart, periodEnd);
  
  // Find incentive matching cleaner
  const cleanerIncentive = incentives.find(
    (i: any) => i.cleanerId === cleanerId
  );
  
  return cleanerIncentive ? cleanerIncentive.bonusAmount : 0;
}

/**
 * Calculate net payout
 */
export function calculateNetPayout({
  baseEarnings,
  bonusEarnings,
  deductions = 0,
}: {
  baseEarnings: number;
  bonusEarnings: number;
  deductions?: number;
}): number {
  const net = baseEarnings + bonusEarnings - deductions;
  return Math.round(net * 100) / 100; // Round to 2 decimals
}

/**
 * Build complete payout calculation for a cleaner
 */
export async function buildCleanerPayout(
  cleanerId: string,
  cleanerPhone: string,
  branch: 'new_jersey' | 'vermont',
  periodStart: string,
  periodEnd: string
): Promise<PayoutCalculation> {
  // Get jobs for period
  const jobs = await getCleanerJobsForPeriod(cleanerId, cleanerPhone, periodStart, periodEnd);
  
  // Calculate base earnings
  const { total: baseEarnings, jobEarnings } = calculateBaseEarnings(jobs);
  
  // Get bonus earnings
  const bonusEarnings = getBonusEarnings(cleanerId, periodStart, periodEnd);
  
  // Calculate net payout (no deductions for now)
  const deductions = 0;
  const netPayout = calculateNetPayout({
    baseEarnings,
    bonusEarnings,
    deductions,
  });

  return {
    totalJobs: jobs.length,
    baseEarnings,
    bonusEarnings,
    deductions,
    netPayout,
    jobs: jobEarnings,
  };
}

