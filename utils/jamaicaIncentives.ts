/**
 * Jamaica Incentive Extensions
 * 
 * Extends incentive logic for Jamaica with JQS bonuses, 5-star reviews, and attendance
 */

import { prisma } from '../lib/prisma';
import { getCleanerAverageJQS } from './jobQualityScore';

/**
 * Calculate JQS bonus for a cleaner
 * Bonus structure:
 * - JQS 90-100: 500 JMD per job
 * - JQS 80-89: 300 JMD per job
 * - JQS 70-79: 150 JMD per job
 * - JQS < 70: 0 JMD
 */
export async function calculateJQSBonus(
  cleanerId: string,
  jobCount: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const avgJQS = await getCleanerAverageJQS(cleanerId);
  
  if (avgJQS >= 90) {
    return jobCount * 500;
  } else if (avgJQS >= 80) {
    return jobCount * 300;
  } else if (avgJQS >= 70) {
    return jobCount * 150;
  }
  
  return 0;
}

/**
 * Calculate 5-star review bonus
 * 200 JMD per 5-star review
 */
export async function calculate5StarReviewBonus(
  cleanerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  // Get jobs with 5-star ratings
  // TODO: Integrate with review system when available
  // For now, return 0
  return 0;
}

/**
 * Calculate attendance bonus
 * 100 JMD per day worked (if worked 5+ days in week)
 */
export async function calculateAttendanceBonus(
  cleanerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  // Get unique days worked
  const jobs = await prisma.job.findMany({
    where: {
      assignedCleanerId: cleanerId,
      status: 'completed',
      completedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    select: {
      completedAt: true,
    },
  });

  const uniqueDays = new Set<string>();
  for (const job of jobs) {
    if (job.completedAt) {
      const day = job.completedAt.toISOString().split('T')[0];
      uniqueDays.add(day);
    }
  }

  const daysWorked = uniqueDays.size;
  
  if (daysWorked >= 5) {
    return daysWorked * 100;
  }
  
  return 0;
}

/**
 * Calculate total Jamaica bonuses for a period
 */
export async function calculateTotalJamaicaBonuses(
  cleanerId: string,
  jobCount: number,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  jqsBonus: number;
  reviewBonus: number;
  attendanceBonus: number;
  total: number;
}> {
  const [jqsBonus, reviewBonus, attendanceBonus] = await Promise.all([
    calculateJQSBonus(cleanerId, jobCount, periodStart, periodEnd),
    calculate5StarReviewBonus(cleanerId, periodStart, periodEnd),
    calculateAttendanceBonus(cleanerId, periodStart, periodEnd),
  ]);

  return {
    jqsBonus,
    reviewBonus,
    attendanceBonus,
    total: jqsBonus + reviewBonus + attendanceBonus,
  };
}


