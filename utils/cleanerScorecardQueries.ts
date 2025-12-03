/**
 * Cleaner Scorecard Queries
 * 
 * Computes performance metrics for cleaners
 * TODO: Replace with database queries when connecting to real DB
 */

import Stripe from 'stripe';
import { findCleanerById } from './cleanerData';

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

export interface CleanerJobWithTimestamps {
  id: string;
  sessionId: string;
  customerName: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation: 'new_jersey' | 'vermont';
  serviceType?: string; // Added for payout calculations
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';
  assignedCleanerId: string;
  createdAt?: string;
  assignedAt?: string;
  onTheWayAt?: string;
  completedAt?: string;
  totalPrice?: number;
  onTime?: boolean;
}

export interface CleanerStats {
  cleanerId: string;
  cleanerName: string;
  region: 'new_jersey' | 'vermont';
  onTimeRate: number; // Percentage
  completionRate: number; // Percentage
  jobsThisWeek: number;
  jobsThisMonth: number;
  customerScore: number; // From reviews (0-100)
  averageHandlingTime: number; // Minutes
  earningsEstimate: number; // Placeholder
  totalJobs: number;
  completedJobs: number;
  onTimeJobs: number;
  // Review metrics
  averageRating: number; // 1-5
  totalReviews: number;
  recleanRequestRate: number; // Percentage
  ratingTrend: number[]; // Last 6 ratings
  // Complaint metrics
  complaintCount: number;
  complaintRate: number; // Percentage
  latestComplaintRatings: number[]; // Last 3 complaint ratings
  // Job Quality Score (JQS)
  averageJQS: number; // Average Job Quality Score (0-100)
  totalJQSJobs: number; // Number of jobs with JQS calculated
}

export interface RegionPerformance {
  region: 'new_jersey' | 'vermont';
  averageCompletionRate: number;
  averageOnTimeRate: number;
  totalCleaners: number;
  totalJobs: number;
}

/**
 * Get cleaner's jobs from Stripe with timestamps
 */
async function getCleanerJobsFromStripe(
  cleanerId: string,
  cleanerPhone: string
): Promise<CleanerJobWithTimestamps[]> {
  const stripe = getStripe();
  const jobs: CleanerJobWithTimestamps[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const metadata = session.metadata || {};
      
      // Check if this job is assigned to this cleaner
      if (metadata.assignedCleanerPhone === cleanerPhone) {
        const firstName = metadata.firstName || '';
        const lastInitial = metadata.lastInitial || '';
        const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

        if (!customerName || !metadata.preferredDate) {
          continue;
        }

        // Determine status
        let status: CleanerJobWithTimestamps['status'] = 'assigned';
        if (metadata.completed === 'true') {
          status = 'completed';
        } else if (metadata.cancelled === 'true') {
          status = 'cancelled';
        } else if (metadata.onTheWay === 'true') {
          status = 'on_the_way';
        } else if (metadata.assignedCleanerPhone) {
          status = 'confirmed';
        }

        // Extract timestamps
        const createdAt = new Date(session.created * 1000).toISOString();
        const assignedAt = metadata.assignedAt || metadata.assignedCleanerAt || undefined;
        const onTheWayAt = metadata.onTheWayAt || undefined;
        const completedAt = metadata.completedAt || undefined;

        // Calculate if on-time
        const onTime = calculateOnTime(
          metadata.preferredDate,
          metadata.preferredTime,
          onTheWayAt
        );

        jobs.push({
          id: session.id,
          sessionId: session.id,
          customerName,
          preferredDate: metadata.preferredDate || '',
          preferredTime: metadata.preferredTime || 'Morning',
          serviceLocation: (metadata.serviceLocation as 'new_jersey' | 'vermont') || 'new_jersey',
          status,
          assignedCleanerId: cleanerId,
          createdAt,
          assignedAt,
          onTheWayAt,
          completedAt,
          totalPrice: session.amount_total ? session.amount_total / 100 : 0,
          onTime,
        });
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return jobs;
}

/**
 * Calculate if cleaner arrived on time
 */
function calculateOnTime(
  preferredDate: string,
  preferredTime: string,
  onTheWayAt?: string
): boolean | undefined {
  if (!onTheWayAt || !preferredDate || !preferredTime) {
    return undefined;
  }

  try {
    // Parse service start time
    const serviceDate = new Date(preferredDate);
    const timeStr = preferredTime.toLowerCase();
    
    // Extract hour from time string
    let serviceHour = 9; // Default to 9 AM
    if (timeStr.includes('morning') || timeStr.includes('am')) {
      const hourMatch = timeStr.match(/(\d+)/);
      if (hourMatch) {
        serviceHour = parseInt(hourMatch[1]);
        if (timeStr.includes('pm') && serviceHour !== 12) {
          serviceHour += 12;
        }
      } else {
        serviceHour = 9; // Default morning
      }
    } else if (timeStr.includes('afternoon') || timeStr.includes('pm')) {
      const hourMatch = timeStr.match(/(\d+)/);
      if (hourMatch) {
        serviceHour = parseInt(hourMatch[1]);
        if (!timeStr.includes('am') && serviceHour !== 12) {
          serviceHour += 12;
        }
      } else {
        serviceHour = 14; // Default afternoon (2 PM)
      }
    } else if (timeStr.includes('evening')) {
      serviceHour = 17; // 5 PM
    }

    serviceDate.setHours(serviceHour, 0, 0, 0);
    
    // Parse onTheWayAt timestamp
    const onTheWayDate = new Date(onTheWayAt);
    
    // Consider on-time if onTheWayAt is before or within 15 minutes of service start
    const diffMinutes = (serviceDate.getTime() - onTheWayDate.getTime()) / (1000 * 60);
    return diffMinutes >= -15; // Allow 15 minutes early
  } catch (error) {
    return undefined;
  }
}

/**
 * Get cleaner's jobs within a date range
 */
export async function getCleanerJobs(
  cleanerId: string,
  range: 'week' | 'month' | 'all'
): Promise<CleanerJobWithTimestamps[]> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return [];
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  
  if (range === 'all') {
    return allJobs;
  }

  const now = new Date();
  const cutoffDate = new Date(now);
  
  if (range === 'week') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (range === 'month') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  }

  return allJobs.filter((job) => {
    const jobDate = new Date(job.preferredDate);
    return jobDate >= cutoffDate;
  });
}

/**
 * Calculate completion rate
 */
export async function getCleanerCompletionRate(cleanerId: string): Promise<number> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return 0;
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  const assignedJobs = allJobs.filter(job => job.status !== 'cancelled');
  const completedJobs = allJobs.filter(job => job.status === 'completed');

  if (assignedJobs.length === 0) {
    return 0;
  }

  return (completedJobs.length / assignedJobs.length) * 100;
}

/**
 * Calculate on-time arrival rate
 */
export async function getCleanerOnTimeRate(cleanerId: string): Promise<number> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return 0;
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  const jobsWithOnTime = allJobs.filter(job => job.onTime !== undefined);
  const onTimeJobs = allJobs.filter(job => job.onTime === true);

  if (jobsWithOnTime.length === 0) {
    return 0;
  }

  return (onTimeJobs.length / jobsWithOnTime.length) * 100;
}

/**
 * Calculate average handling time (AHT) in minutes
 */
export async function calculateAverageHandlingTime(cleanerId: string): Promise<number> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return 0;
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  const completedJobs = allJobs.filter(
    job => job.status === 'completed' && job.onTheWayAt && job.completedAt
  );

  if (completedJobs.length === 0) {
    return 0;
  }

  const totalMinutes = completedJobs.reduce((sum, job) => {
    if (job.onTheWayAt && job.completedAt) {
      const start = new Date(job.onTheWayAt);
      const end = new Date(job.completedAt);
      const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return sum + diffMinutes;
    }
    return sum;
  }, 0);

  return totalMinutes / completedJobs.length;
}

/**
 * Calculate earnings estimate (placeholder)
 */
export async function calculateEarningsEstimate(cleanerId: string): Promise<number> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return 0;
  }

  const monthJobs = await getCleanerJobs(cleanerId, 'month');
  const completedMonthJobs = monthJobs.filter(job => job.status === 'completed');
  
  return completedMonthJobs.reduce((sum, job) => sum + (job.totalPrice || 0), 0);
}

/**
 * Get all cleaner stats
 */
export async function getCleanerStats(cleanerId: string): Promise<CleanerStats | null> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return null;
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  const weekJobs = await getCleanerJobs(cleanerId, 'week');
  const monthJobs = await getCleanerJobs(cleanerId, 'month');

  const assignedJobs = allJobs.filter(job => job.status !== 'cancelled');
  const completedJobs = allJobs.filter(job => job.status === 'completed');
  const onTimeJobs = allJobs.filter(job => job.onTime === true);
  const jobsWithOnTime = allJobs.filter(job => job.onTime !== undefined);

  const completionRate = assignedJobs.length > 0
    ? (completedJobs.length / assignedJobs.length) * 100
    : 0;

  const onTimeRate = jobsWithOnTime.length > 0
    ? (onTimeJobs.length / jobsWithOnTime.length) * 100
    : 0;

  const averageHandlingTime = await calculateAverageHandlingTime(cleanerId);
  const earningsEstimate = await calculateEarningsEstimate(cleanerId);

    // Calculate customer score from reviews
    const { calculateReviewStats } = await import('@/utils/reviewData');
    const reviewStats = calculateReviewStats(cleaner.id);
    
    // Convert 1-5 rating to 0-100 score
    const customerScore = reviewStats.averageRating > 0
      ? (reviewStats.averageRating / 5) * 100
      : 0;

    return {
      cleanerId: cleaner.id,
      cleanerName: cleaner.name,
      region: cleaner.region,
      onTimeRate,
      completionRate,
      jobsThisWeek: weekJobs.filter(job => job.status === 'completed').length,
      jobsThisMonth: monthJobs.filter(job => job.status === 'completed').length,
      customerScore,
      averageHandlingTime,
      earningsEstimate,
      totalJobs: assignedJobs.length,
      completedJobs: completedJobs.length,
      onTimeJobs: onTimeJobs.length,
    // Review metrics
    averageRating: reviewStats.averageRating,
    totalReviews: reviewStats.totalReviews,
    recleanRequestRate: reviewStats.recleanRequestRate,
    ratingTrend: reviewStats.ratingTrend,
    // Complaint metrics (will be added by API route)
    complaintCount: 0,
    complaintRate: 0,
    latestComplaintRatings: [],
  };
}

/**
 * Get region performance (aggregate stats for all cleaners in region)
 */
export async function getCleanerRegionPerformance(
  region: 'new_jersey' | 'vermont'
): Promise<RegionPerformance> {
  // TODO: Get all cleaners in region from database
  // For now, using mock data
  const { getAllCleaners } = await import('./cleanerData');
  const allCleaners = getAllCleaners();
  const regionCleaners = allCleaners.filter(c => c.region === region && c.active);

  if (regionCleaners.length === 0) {
    return {
      region,
      averageCompletionRate: 0,
      averageOnTimeRate: 0,
      totalCleaners: 0,
      totalJobs: 0,
    };
  }

  let totalCompletionRate = 0;
  let totalOnTimeRate = 0;
  let totalJobs = 0;

  for (const cleaner of regionCleaners) {
    const stats = await getCleanerStats(cleaner.id);
    if (stats) {
      totalCompletionRate += stats.completionRate;
      totalOnTimeRate += stats.onTimeRate;
      totalJobs += stats.totalJobs;
    }
  }

  return {
    region,
    averageCompletionRate: totalCompletionRate / regionCleaners.length,
    averageOnTimeRate: totalOnTimeRate / regionCleaners.length,
    totalCleaners: regionCleaners.length,
    totalJobs,
  };
}

/**
 * Get jobs completed by day for chart
 */
export async function getJobsByDay(cleanerId: string, days: number = 30): Promise<
  Array<{ date: string; count: number }>
> {
  const cleaner = findCleanerById(cleanerId);
  if (!cleaner) {
    return [];
  }

  const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);
  const completedJobs = allJobs.filter(job => job.status === 'completed');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const jobsByDay: Record<string, number> = {};

  completedJobs.forEach((job) => {
    if (job.completedAt) {
      const completedDate = new Date(job.completedAt);
      if (completedDate >= cutoffDate) {
        const dateStr = completedDate.toISOString().split('T')[0];
        jobsByDay[dateStr] = (jobsByDay[dateStr] || 0) + 1;
      }
    }
  });

  // Fill in missing dates with 0
  const result: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: jobsByDay[dateStr] || 0,
    });
  }

  return result;
}

