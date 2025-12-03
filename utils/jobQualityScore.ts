/**
 * Job Quality Score (JQS) Calculator
 * 
 * Calculates JQS for completed jobs based on:
 * - onTime (10 points)
 * - checklistComplete (10 points)
 * - photosUploaded (10 points)
 * - rating * 8 (max 40 points)
 * - noComplaints (30 points)
 * 
 * Total: 0-100 points
 */

import { prisma } from '@/lib/prisma';

interface JQSCalculationInput {
  jobId: string;
  onTime?: boolean;
  checklistComplete?: boolean;
  photosUploaded?: boolean;
  rating?: number; // 1-5 scale
  hasComplaints?: boolean;
}

/**
 * Calculate Job Quality Score for a job
 */
export async function calculateJobQualityScore(
  jobId: string,
  input: Partial<JQSCalculationInput> = {}
): Promise<number> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        onTheWayAt: true,
        completedAt: true,
      },
    });

    if (!job || job.status !== 'completed') {
      return 0; // Can't calculate score for incomplete jobs
    }

    let score = 0;

    // 1. On-Time (10 points)
    const onTime = input.onTime ?? calculateOnTime(job.preferredDate, job.preferredTime, job.onTheWayAt);
    if (onTime) {
      score += 10;
    }

    // 2. Checklist Complete (10 points)
    // TODO: This would come from a checklist submission
    // For now, assume true if job is completed
    const checklistComplete = input.checklistComplete ?? true;
    if (checklistComplete) {
      score += 10;
    }

    // 3. Photos Uploaded (10 points)
    // TODO: Check if photos were uploaded
    // For now, assume false
    const photosUploaded = input.photosUploaded ?? false;
    if (photosUploaded) {
      score += 10;
    }

    // 4. Rating (max 40 points = 5 * 8)
    // Get rating from reviews/complaints
    let rating = input.rating;
    if (!rating) {
      // Try to get from reviews
      // TODO: Implement review lookup
      rating = 0;
    }
    const ratingPoints = Math.min(rating * 8, 40);
    score += ratingPoints;

    // 5. No Complaints (30 points)
    // Check if there are complaints for this job
    let hasComplaints = input.hasComplaints;
    if (hasComplaints === undefined) {
      // TODO: Check complaints table
      hasComplaints = false;
    }
    if (!hasComplaints) {
      score += 30;
    }

    return Math.min(score, 100); // Cap at 100
  } catch (error: any) {
    console.error('Error calculating JQS:', error);
    return 0;
  }
}

/**
 * Calculate if cleaner arrived on time
 */
function calculateOnTime(
  preferredDate: Date | null,
  preferredTime: string | null,
  onTheWayAt: Date | null
): boolean {
  if (!preferredDate || !preferredTime || !onTheWayAt) {
    return false;
  }

  // Parse preferred time to get scheduled start time
  const scheduledStart = new Date(preferredDate);
  const [hours, minutes] = preferredTime.split(':').map(Number);
  scheduledStart.setHours(hours || 9, minutes || 0, 0, 0);

  // Allow 15-minute buffer (early arrival is on-time)
  const bufferMinutes = 15;
  const earliestAcceptable = new Date(scheduledStart);
  earliestAcceptable.setMinutes(earliestAcceptable.getMinutes() - bufferMinutes);

  // Check if onTheWayAt is before scheduled start (with buffer)
  return onTheWayAt >= earliestAcceptable && onTheWayAt <= scheduledStart;
}

/**
 * Update job quality score in database
 */
export async function updateJobQualityScore(jobId: string): Promise<number> {
  try {
    const score = await calculateJobQualityScore(jobId);

    await prisma.job.update({
      where: { id: jobId },
      data: { jobQualityScore: score },
    });

    return score;
  } catch (error: any) {
    console.error('Error updating JQS:', error);
    throw error;
  }
}

/**
 * Get average JQS for a cleaner
 */
export async function getCleanerAverageJQS(cleanerId: string): Promise<number> {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
        jobQualityScore: { not: null },
      },
      select: {
        jobQualityScore: true,
      },
    });

    if (jobs.length === 0) {
      return 0;
    }

    const totalScore = jobs.reduce((sum, job) => sum + (job.jobQualityScore || 0), 0);
    return Math.round(totalScore / jobs.length);
  } catch (error: any) {
    console.error('Error calculating average JQS:', error);
    return 0;
  }
}

