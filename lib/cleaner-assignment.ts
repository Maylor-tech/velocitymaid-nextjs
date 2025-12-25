import { prisma } from './prisma';
import { sendCleanerAssignment } from './sendCleanerAssignment';
import { getCleanerAverageJQS } from '../utils/jobQualityScore';
import { isCleanerTrainingEligible } from '../utils/trainingEligibility';
import { resolveCityFromZip } from '../utils/cityRouting';

export interface AssignmentResult {
  success: boolean;
  cleanerId?: string;
  cleanerName?: string;
  reason?: string;
}

interface FindBestCleanerParams {
  branchId: string;
  scheduledDate: Date;
  scheduledTime: string | null;
  zipCode?: string | null;
}

/**
 * Check if cleaner is available for a job (with time slot validation)
 * 
 * Validates:
 * - Working days match
 * - Time ranges overlap
 * - Blackout dates
 * - Max daily jobs not exceeded
 * - No overlapping time slot conflicts
 */
async function isCleanerAvailableForJob(
  cleanerId: string,
  preferredDate: Date,
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

    // Check time range overlap if preferredTime is provided
    if (preferredTime && timeRanges.length > 0) {
      // Parse preferredTime to get hour (handles formats like "10:00 AM", "2:00 PM", "14:00")
      let jobHour: number | null = null;
      const timeMatch = preferredTime.match(/(\d+):?\d*\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const period = timeMatch[2].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        jobHour = hour;
      } else {
        const hour24Match = preferredTime.match(/(\d+):/);
        if (hour24Match) {
          jobHour = parseInt(hour24Match[1]);
        }
      }

      // If we have a job hour, check if it falls within any time range
      if (jobHour !== null) {
        let timeMatches = false;
        for (const range of timeRanges) {
          const rangeStart = parseInt(range.start.split(':')[0]);
          const rangeEnd = parseInt(range.end.split(':')[0]);
          // Check if job hour is within range (handles wrap-around)
          if (rangeStart <= rangeEnd) {
            if (jobHour >= rangeStart && jobHour < rangeEnd) {
              timeMatches = true;
              break;
            }
          } else {
            // Wrap-around case (e.g., 22:00 to 02:00)
            if (jobHour >= rangeStart || jobHour < rangeEnd) {
              timeMatches = true;
              break;
            }
          }
        }
        if (!timeMatches) {
          return false;
        }
      }
    }

    // Check max daily jobs
    const dayStart = new Date(jobDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(jobDate);
    dayEnd.setHours(23, 59, 59, 999);

    const jobsOnDate = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['cancelled', 'completed', 'DECLINED'],
        },
      },
    });

    if (jobsOnDate >= availability.maxDailyJobs) {
      return false;
    }

    // Check for overlapping time slot conflicts (not just same date)
    if (preferredTime) {
      // Get all jobs on the same date for this cleaner
      const sameDayJobs = await prisma.job.findMany({
        where: {
          assignedCleanerId: cleanerId,
          preferredDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            notIn: ['cancelled', 'completed', 'DECLINED'],
          },
        },
        select: {
          preferredTime: true,
        },
      });

      // Simple overlap check: if same time slot, consider it a conflict
      // More sophisticated overlap detection could be added here
      for (const existingJob of sameDayJobs) {
        if (existingJob.preferredTime === preferredTime) {
          return false; // Exact time match conflict
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error checking cleaner availability:', error);
    return false;
  }
}

/**
 * UNIFIED CORE CLEANER SELECTION LOGIC
 * 
 * This is the single source of truth for cleaner assignment.
 * Incorporates:
 * - CleanerAvailability (working days, time ranges, max daily jobs, blackout dates)
 * - Time slot validation (not just date-level conflicts)
 * - preferSameCleaner customer preference
 * - JQS (Job Quality Score) for ranking
 * - Distance/city matching for NJ
 * - Training status for Jamaica
 * - Weekly job count for workload balancing
 * 
 * @param job - Job record with Branch and Customer relations
 * @returns Best cleaner match or null
 */
async function selectBestCleanerForJob(job: {
  id: string;
  branchId: string;
  customerId: string | null;
  preferredDate: Date;
  preferredTime: string | null;
  address: string | null;
  Branch: { id: string; slug: string };
}): Promise<{ cleanerId: string; cleanerName: string } | null> {
  try {
    const { branchId, customerId, preferredDate, preferredTime, address, Branch } = job;

    // Get branch info for Jamaica training check
    const isJamaicaBranch =
      Branch.slug === 'port-antonio';

    // Get customer preference for preferSameCleaner
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

    // Get job city from address (for NJ distance matching)
    let jobCity: string | null = null;
    if (address && Branch.slug === 'new-jersey') {
      const zipMatch = address.match(/\b\d{5}\b/);
      if (zipMatch) {
        jobCity = resolveCityFromZip(zipMatch[0]);
      }
    }

    // Get all cleaners for this branch (via CleanerApplication for approved status)
    const approvedCleaners = await prisma.cleanerApplication.findMany({
      where: {
        branchId,
        status: 'APPROVED',
      },
    });

    if (approvedCleaners.length === 0) {
      return null;
    }

    // Get User records for approved cleaners and check eligibility
    const eligibleCleaners: Array<{
      id: string;
      name: string;
      email: string;
      trainingStatus: { overallStatus: string } | null;
      availability: {
        workingDays: string[];
        timeRanges: Array<{ start: string; end: string }>;
        maxDailyJobs: number;
        blackoutDates: string[];
        isActive: boolean;
      } | null;
      preferredCities: string[] | null;
    }> = [];

    for (const cleanerApp of approvedCleaners) {
      const cleaner = await prisma.user.findUnique({
        where: { email: cleanerApp.email },
        include: {
          trainingStatus: true,
          availability: true,
        },
      });

      if (!cleaner || !cleaner.isActive) {
        continue;
      }

      // Check training for Jamaica
      if (isJamaicaBranch) {
        if (cleaner.trainingStatus?.overallStatus !== 'PASSED') {
          continue;
        }
      }

      // For NJ branch, filter by preferred cities if city is known
      if (Branch.slug === 'new-jersey' && jobCity) {
        const preferredCities = cleaner.preferredCities || [];
        // If cleaner has preferred cities, they must include the job city
        if (preferredCities.length > 0 && !preferredCities.includes(jobCity)) {
          continue;
        }
      }

      eligibleCleaners.push({
        id: cleaner.id,
        name: cleaner.name || cleanerApp.name || 'Cleaner',
        email: cleaner.email,
        trainingStatus: cleaner.trainingStatus,
        availability: cleaner.availability ? {
          workingDays: cleaner.availability.workingDays as string[],
          timeRanges: cleaner.availability.timeRanges as Array<{ start: string; end: string }>,
          maxDailyJobs: cleaner.availability.maxDailyJobs,
          blackoutDates: (cleaner.availability.blackoutDates as string[]) || [],
          isActive: cleaner.availability.isActive,
        } : null,
        preferredCities: cleaner.preferredCities,
      });
    }

    // If preferSameCleaner and previousCleanerId exists, prioritize that cleaner
    if (preferSameCleaner && previousCleanerId) {
      const previousCleaner = eligibleCleaners.find((c) => c.id === previousCleanerId);
      if (previousCleaner) {
        const isAvailable = await isCleanerAvailableForJob(
          previousCleaner.id,
          preferredDate,
          preferredTime,
          branchId
        );
        if (isAvailable) {
          return {
            cleanerId: previousCleaner.id,
            cleanerName: previousCleaner.name,
          };
        }
      }
    }

    // Get available cleaners with scoring
    const availableCleaners: Array<{
      cleanerId: string;
      cleanerName: string;
      avgJQS: number;
      distanceScore: number;
      weeklyJobCount: number;
    }> = [];

    // Calculate week boundaries for workload balancing
    const weekStart = new Date(preferredDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    for (const cleaner of eligibleCleaners) {
      const isAvailable = await isCleanerAvailableForJob(
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

        // Calculate weekly job count for workload balancing
        const weeklyJobCount = await prisma.job.count({
          where: {
            assignedCleanerId: cleaner.id,
            preferredDate: {
              gte: weekStart,
              lt: weekEnd,
            },
            status: {
              notIn: ['cancelled', 'completed'],
            },
          },
        });

        availableCleaners.push({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
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

    return {
      cleanerId: availableCleaners[0].cleanerId,
      cleanerName: availableCleaners[0].cleanerName,
    };
  } catch (error: any) {
    console.error('Error in selectBestCleanerForJob:', error);
    return null;
  }
}

/**
 * @deprecated This function is replaced by selectBestCleanerForJob() which includes
 * availability checks, time slot validation, JQS, and preferSameCleaner logic.
 * 
 * Find the best available cleaner for a job
 * 
 * Logic:
 * 1. Query CleanerApplication where status = 'APPROVED' and branchId matches
 * 2. For each approved cleaner, check they don't have a Job at the same date/time
 * 3. Score by: fewer jobs this week = higher priority (for workload balance)
 * 4. Return top cleaner or null
 */
export async function findBestCleaner(
  params: FindBestCleanerParams
): Promise<{ cleanerId: string; cleanerName: string } | null> {
  const { branchId, scheduledDate, scheduledTime } = params;

  try {
    // Get all approved cleaners for this branch
    const approvedCleaners = await prisma.cleanerApplication.findMany({
      where: {
        branchId,
        status: 'APPROVED',
      },
      include: {
        // Get the User record for this cleaner
        // Note: CleanerApplication doesn't have a direct relation to User,
        // so we'll need to match by email or phone
      },
    });

    if (approvedCleaners.length === 0) {
      return null;
    }

    // Get the start and end of the week for workload calculation
    const weekStart = new Date(scheduledDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7); // End of week

    // Score each cleaner
    const cleanerScores: Array<{
      cleanerId: string;
      cleanerName: string;
      score: number;
    }> = [];

    for (const cleanerApp of approvedCleaners) {
      // Find the User record for this cleaner (match by email)
      const cleaner = await prisma.user.findUnique({
        where: { email: cleanerApp.email },
      });

      if (!cleaner || !cleaner.isActive) {
        continue; // Skip inactive cleaners
      }

      // Check if cleaner has a conflicting job on the same date
      // For now, we'll be conservative and skip cleaners with any job on that date
      // (Can be enhanced later to check time slots more precisely)
      const conflictingJob = await prisma.job.findFirst({
        where: {
          assignedCleanerId: cleaner.id,
          preferredDate: scheduledDate,
          status: {
            notIn: ['cancelled', 'completed'],
          },
        },
      });

      if (conflictingJob) {
        continue; // Skip cleaners with conflicting jobs on the same date
      }

      // Count jobs this week for workload balance
      const jobsThisWeek = await prisma.job.count({
        where: {
          assignedCleanerId: cleaner.id,
          preferredDate: {
            gte: weekStart,
            lt: weekEnd,
          },
          status: {
            notIn: ['cancelled'],
          },
        },
      });

      // Score: fewer jobs = higher priority
      // Lower score number = higher priority (we'll sort ascending)
      cleanerScores.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name || cleanerApp.name || 'Cleaner',
        score: jobsThisWeek,
      });
    }

    if (cleanerScores.length === 0) {
      return null;
    }

    // Sort by score (ascending - fewer jobs = higher priority)
    cleanerScores.sort((a, b) => a.score - b.score);

    // Return the cleaner with the lowest score (fewest jobs this week)
    return {
      cleanerId: cleanerScores[0].cleanerId,
      cleanerName: cleanerScores[0].cleanerName,
    };
  } catch (error) {
    console.error('Error finding best cleaner:', error);
    return null;
  }
}

/**
 * Auto-assign a cleaner to a job
 * 
 * This is the main entry point for automatic cleaner assignment.
 * Uses the unified selectBestCleanerForJob() logic which includes:
 * - CleanerAvailability validation
 * - Time slot conflict checking
 * - preferSameCleaner support
 * - JQS-based ranking
 * - Distance/city matching
 * - Training status checks
 * - Workload balancing
 * 
 * @param jobId - The job ID to assign a cleaner to
 * @returns Assignment result with success status and cleaner info
 */
export async function autoAssignCleaner(jobId: string): Promise<AssignmentResult> {
  try {
    // Get job from database with relations
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        branch: {
          select: {
            id: true,
            slug: true,
          },
        },
        customer: {
          select: {
            id: true,
            preferSameCleaner: true,
          },
        },
      },
    });

    if (!job) {
      // Structured logging for assignment failure
      console.log('[ASSIGNMENT_FAILURE]', JSON.stringify({
        jobId,
        reason: 'job_not_found',
        timestamp: new Date().toISOString(),
      }));
      
      // Log to AssignmentLog
      try {
        await prisma.assignmentLog.create({
          data: {
            jobId,
            cleanerId: null,
            branchId: '', // Will fail but that's okay
            outcome: 'NO_CLEANER',
            reason: 'Job not found',
            details: { error: 'job_not_found' },
          },
        });
      } catch (e) {
        // Ignore logging errors
      }
      
      return {
        success: false,
        reason: 'job_not_found',
      };
    }

    // Phase 5 Step 4: Check if customer is blocked
    if (job.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: job.customerId },
        select: { isBlocked: true },
      });

      if (customer?.isBlocked) {
        console.warn(`[ASSIGNMENT_BLOCKED] Customer ${job.customerId} is blocked - job ${jobId} cannot be assigned`);
        
        // Create ComplianceIssue
        try {
          await prisma.complianceIssue.create({
            data: {
              customerId: job.customerId,
              type: 'BLOCKED_CUSTOMER_ASSIGNMENT_ATTEMPT',
              severity: 3,
              summary: `Assignment attempt for blocked customer on job ${jobId}`,
              details: `Auto-assignment prevented for blocked customer`,
              status: 'OPEN',
            },
          });
        } catch (e) {
          console.error('Failed to create compliance issue:', e);
        }

        // Log to AssignmentLog
        try {
          await prisma.assignmentLog.create({
            data: {
              jobId,
              cleanerId: null,
              branchId: job.branchId,
              outcome: 'NO_CLEANER',
              reason: 'Customer is blocked',
              details: { customerBlocked: true },
            },
          });
        } catch (e) {
          // Ignore logging errors
        }

        return {
          success: false,
          reason: 'customer_blocked',
        };
      }
    }

    // If job already has cleanerId, return early
    if (job.assignedCleanerId) {
      return {
        success: true,
        cleanerId: job.assignedCleanerId,
        reason: 'already_assigned',
      };
    }

    // Validate required fields
    if (!job.preferredDate) {
      // Structured logging for assignment failure
      console.log('[ASSIGNMENT_FAILURE]', JSON.stringify({
        jobId,
        branchId: job.branchId,
        branchSlug: job.branch?.slug,
        reason: 'no_scheduled_date',
        timestamp: new Date().toISOString(),
      }));
      return {
        success: false,
        reason: 'no_scheduled_date',
      };
    }

    // Extract city from address for logging
    let jobCity: string | null = null;
    if (job.address && job.branch?.slug === 'new-jersey') {
      const zipMatch = job.address.match(/\b\d{5}\b/);
      if (zipMatch) {
        jobCity = resolveCityFromZip(zipMatch[0]);
      }
    }

    // Use unified cleaner selection logic
    if (!job.branch) {
      console.log('[ASSIGNMENT_FAILURE]', JSON.stringify({
        jobId,
        branchId: job.branchId,
        reason: 'branch_not_found',
        timestamp: new Date().toISOString(),
      }));
      return {
        success: false,
        reason: 'branch_not_found',
      };
    }

    const bestCleaner = await selectBestCleanerForJob({
      id: job.id,
      branchId: job.branchId,
      customerId: job.customerId,
      preferredDate: job.preferredDate,
      preferredTime: job.preferredTime,
      address: job.address,
      Branch: {
        id: job.branch.id,
        slug: job.branch.slug,
      },
    });

    if (!bestCleaner) {
      // Structured logging for assignment failure
      console.log('[ASSIGNMENT_FAILURE]', JSON.stringify({
        jobId,
        branchId: job.branchId,
        branchSlug: job.branch?.slug,
        preferredDate: job.preferredDate.toISOString(),
        preferredTime: job.preferredTime,
        city: jobCity,
        customerId: job.customerId,
        reason: 'no_cleaner_available',
        timestamp: new Date().toISOString(),
      }));
      // Log no cleaner available
      try {
        await prisma.assignmentLog.create({
          data: {
            jobId: job.id,
            cleanerId: null,
            branchId: job.branchId,
            outcome: 'NO_CLEANER',
            reason: 'No available cleaners for date/time window',
            details: {
              jobDate: job.preferredDate?.toISOString(),
              jobTime: job.preferredTime,
            },
          },
        });
      } catch (logError: any) {
        console.error('Error logging assignment:', logError);
      }
      
      return {
        success: false,
        reason: 'no_cleaner_available',
      };
    }

    // Update job with cleaner assignment
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: bestCleaner.cleanerId,
        status: 'assigned',
        assignedAt: new Date(),
      },
    });

    // Send WhatsApp notification to cleaner (non-blocking)
    try {
      const whatsappToken = process.env.WHATSAPP_TOKEN;
      const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (whatsappToken && whatsappPhoneNumberId) {
        // Get cleaner's phone number
        const cleaner = await prisma.user.findUnique({
          where: { id: bestCleaner.cleanerId },
        });

        if (cleaner) {
          // Find cleaner application for phone number
          const cleanerApp = await prisma.cleanerApplication.findFirst({
            where: {
              email: cleaner.email,
              status: 'APPROVED',
            },
          });

          const cleanerPhone = cleanerApp?.phone || null;

          if (cleanerPhone) {
            // Send WhatsApp notification
            await sendCleanerAssignment(
              whatsappPhoneNumberId,
              whatsappToken,
              {
                phone: cleanerPhone,
                name: bestCleaner.cleanerName,
              },
              {
                customerName: job.customerName || 'Customer',
                serviceType: job.serviceType || 'basic',
                preferredDate: job.preferredDate?.toISOString().split('T')[0] || '',
                preferredTime: job.preferredTime || 'Morning',
                address: job.address || '',
                serviceLocation: job.serviceLocation || undefined,
              }
            ).catch((error) => {
              console.error('WhatsApp notification failed (non-fatal):', error);
            });
          }
        }
      }
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notification (non-fatal):', whatsappError);
      // Don't fail assignment if WhatsApp fails
    }

    // Log assignment to AssignmentLog
    try {
      await prisma.assignmentLog.create({
        data: {
          jobId: job.id,
          cleanerId: bestCleaner.cleanerId,
          branchId: job.branchId,
          outcome: 'ASSIGNED',
          reason: `Assigned ${bestCleaner.cleanerName}`,
          details: {
            assignedCleaner: {
              id: bestCleaner.cleanerId,
              name: bestCleaner.cleanerName,
            },
            jobDate: job.preferredDate?.toISOString(),
            jobTime: job.preferredTime,
          },
        },
      });
    } catch (logError: any) {
      // Don't fail assignment if logging fails
      console.error('Error logging assignment:', logError);
    }

    // Log successful assignment
    console.log('[ASSIGNMENT_SUCCESS]', JSON.stringify({
      jobId,
      cleanerId: bestCleaner.cleanerId,
      cleanerName: bestCleaner.cleanerName,
      branchId: job.branchId,
      branchSlug: job.branch?.slug,
      preferredDate: job.preferredDate.toISOString(),
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      cleanerId: bestCleaner.cleanerId,
      cleanerName: bestCleaner.cleanerName,
    };
  } catch (error: any) {
    // Structured logging for assignment error
    console.log('[ASSIGNMENT_ERROR]', JSON.stringify({
      jobId,
      error: error.message || 'unknown_error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }));
    console.error('Error in autoAssignCleaner:', error);
    return {
      success: false,
      reason: error.message || 'unknown_error',
    };
  }
}

