/**
 * Job Assignment Logic
 * 
 * Handles job assignment with recurring customer preferences and JQS-based selection
 */

import { prisma } from '@/lib/prisma';
import { getCleanerAverageJQS } from './jobQualityScore';
import { isCleanerTrainingEligible } from './trainingEligibility';
import { resolveCityFromZip } from './cityRouting';

interface AssignmentOptions {
  jobId: string;
  branchId: string;
  preferredDate: Date | null;
  preferredTime: string | null;
  customerId?: string | null;
  forceCleanerId?: string; // For manual assignment
}

/**
 * Find best cleaner for a job
 * 
 * Logic:
 * 1. If customer.preferSameCleaner === true, try to assign same cleaner
 * 2. Else, assign highest JQS cleaner
 * 3. Must meet trainingStatus === "PASSED" for Jamaica
 * 4. Must be available (working days, time ranges, max daily jobs, blackout dates)
 */
export async function findBestCleanerForJob(options: AssignmentOptions): Promise<string | null> {
  try {
    const { jobId, branchId, preferredDate, preferredTime, customerId, forceCleanerId } = options;

    // Get branch info
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        country: true,
        slug: true,
      },
    });

    if (!branch) {
      return null;
    }

    const isJamaicaBranch =
      branch.country === 'Jamaica' ||
      branch.country === 'JM' ||
      branch.slug === 'port-antonio';

    // If forceCleanerId provided, use it (but still validate)
    if (forceCleanerId) {
      const cleaner = await prisma.user.findUnique({
        where: { id: forceCleanerId, role: 'CLEANER' },
        include: {
          trainingStatus: true,
          availability: true,
        },
      });

      if (!cleaner) {
        return null;
      }

      // Check training for Jamaica
      if (isJamaicaBranch) {
        if (cleaner.trainingStatus?.overallStatus !== 'PASSED') {
          return null;
        }
      }

      // Check availability
      if (await isCleanerAvailable(cleaner.id, preferredDate, preferredTime, branchId)) {
        return cleaner.id;
      }

      return null;
    }

    // Get customer preference
    let preferSameCleaner = false;
    let previousCleanerId: string | null = null;

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          preferSameCleaner: true,
        },
      });

      preferSameCleaner = customer?.preferSameCleaner || false;

      // Find previous cleaner if preferSameCleaner
      if (preferSameCleaner) {
        const previousJob = await prisma.job.findFirst({
          where: {
            customerId,
            assignedCleanerId: { not: null },
            status: 'completed',
          },
          orderBy: {
            completedAt: 'desc',
          },
          select: {
            assignedCleanerId: true,
          },
        });

        previousCleanerId = previousJob?.assignedCleanerId || null;
      }
    }

    // Get job ZIP to determine city
    let jobCity: string | null = null;
    if (preferredDate) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { address: true },
      });
      
      // Extract ZIP from address or use customer ZIP
      if (job?.address) {
        const zipMatch = job.address.match(/\b\d{5}\b/);
        if (zipMatch) {
          jobCity = resolveCityFromZip(zipMatch[0]);
        }
      }
    }

    // Get all cleaners for this branch
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        primaryBranchId: branchId,
      },
      include: {
        trainingStatus: true,
        availability: true,
      },
    });

    // Filter cleaners
    const eligibleCleaners = cleaners.filter((cleaner) => {
      // Check training for Jamaica
      if (isJamaicaBranch) {
        if (cleaner.trainingStatus?.overallStatus !== 'PASSED') {
          return false;
        }
      }

      // For NJ branch, filter by preferred cities if city is known
      if (branch.slug === 'new-jersey' && jobCity) {
        const preferredCities = cleaner.preferredCities || [];
        // If cleaner has preferred cities, they must include the job city
        if (preferredCities.length > 0 && !preferredCities.includes(jobCity)) {
          return false;
        }
      }

      // Check availability (will check in next step)
      return true;
    });

    // If preferSameCleaner and previousCleanerId exists, prioritize that cleaner
    if (preferSameCleaner && previousCleanerId) {
      const previousCleaner = eligibleCleaners.find((c) => c.id === previousCleanerId);
      if (previousCleaner) {
        const isAvailable = await isCleanerAvailable(
          previousCleaner.id,
          preferredDate,
          preferredTime,
          branchId
        );
        if (isAvailable) {
          return previousCleaner.id;
        }
      }
    }

    // Get available cleaners with JQS, distance, and weekly job count
    const availableCleaners = [];
    for (const cleaner of eligibleCleaners) {
      const isAvailable = await isCleanerAvailable(
        cleaner.id,
        preferredDate,
        preferredTime,
        branchId
      );
      if (isAvailable) {
        const avgJQS = await getCleanerAverageJQS(cleaner.id);
        
        // Calculate distance score (1 if same city, 0 otherwise)
        const cleanerPreferredCities = cleaner.preferredCities || [];
        const distanceScore = jobCity && cleanerPreferredCities.includes(jobCity) ? 1 : 0;
        
        // Calculate weekly job count
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weeklyJobCount = await prisma.job.count({
          where: {
            assignedCleanerId: cleaner.id,
            status: { in: ['assigned', 'in_progress', 'completed'] },
            assignedAt: { gte: weekStart },
          },
        });
        
        availableCleaners.push({
          cleanerId: cleaner.id,
          avgJQS,
          distanceScore,
          weeklyJobCount,
        });
      }
    }

    if (availableCleaners.length === 0) {
      return null;
    }

    // Sort by: distance (highest), then weekly job count (lowest), then JQS (highest)
    availableCleaners.sort((a, b) => {
      // First, sort by distance (same city preferred)
      if (a.distanceScore !== b.distanceScore) {
        return b.distanceScore - a.distanceScore;
      }
      // Then, sort by weekly job count (load balancing)
      if (a.weeklyJobCount !== b.weeklyJobCount) {
        return a.weeklyJobCount - b.weeklyJobCount;
      }
      // Finally, sort by JQS
      return b.avgJQS - a.avgJQS;
    });

    return availableCleaners[0].cleanerId;
  } catch (error: any) {
    console.error('Error finding best cleaner:', error);
    return null;
  }
}

/**
 * Check if cleaner is available for a job
 */
async function isCleanerAvailable(
  cleanerId: string,
  preferredDate: Date | null,
  preferredTime: string | null,
  branchId: string
): Promise<boolean> {
  try {
    const availability = await prisma.cleanerAvailability.findUnique({
      where: { cleanerId },
    });

    if (!availability || !availability.isActive) {
      return false;
    }

    if (!preferredDate) {
      return true; // No date specified, assume available
    }

    const workingDays = availability.workingDays as string[];
    const timeRanges = availability.timeRanges as Array<{ start: string; end: string }>;
    const blackoutDates = (availability.blackoutDates as string[]) || [];

    // Check working day
    const jobDate = new Date(preferredDate);
    const dayName = jobDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!workingDays.includes(dayName)) {
      return false;
    }

    // Check blackout dates
    const jobDateStr = jobDate.toISOString().split('T')[0];
    if (blackoutDates.includes(jobDateStr)) {
      return false;
    }

    // Check time range (simplified - would need more complex logic for exact matching)
    if (preferredTime && timeRanges.length > 0) {
      // For now, just check if cleaner has any time ranges
      // TODO: Implement exact time matching
    }

    // Check max daily jobs
    const jobsOnDate = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: new Date(jobDate.setHours(0, 0, 0, 0)),
          lt: new Date(jobDate.setHours(23, 59, 59, 999)),
        },
        status: {
          notIn: ['cancelled', 'DECLINED'],
        },
      },
    });

    if (jobsOnDate >= availability.maxDailyJobs) {
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Error checking cleaner availability:', error);
    return false;
  }
}

