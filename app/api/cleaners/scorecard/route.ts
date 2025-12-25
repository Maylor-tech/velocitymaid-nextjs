export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCleanerStats, getJobsByDay, getCleanerJobs } from '../../../../utils/cleanerScorecardQueries';
import { getReviewsByCleanerId, calculateReviewStats } from '../../../../utils/reviewData';
import { getComplaintsByCleanerId } from '../../../../utils/complaintData';
import { getLatestIncentive } from '../../../../utils/incentiveData';
import { getCleanerAverageJQS } from '../../../../utils/jobQualityScore';

/**
 * Get Cleaner Scorecard Data
 * 
 * GET /api/cleaners/scorecard
 * 
 * Returns: { success: true, stats: CleanerStats, jobsByDay: [], recentJobs: [] }
 */
export async function GET(request: NextRequest) {
  try {
    // Get cleaner ID from cookie
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get stats
    const stats = await getCleanerStats(cleanerId);
    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Get jobs by day for chart
    const jobsByDay = await getJobsByDay(cleanerId, 30);

    // Get recent jobs
    const recentJobs = await getCleanerJobs(cleanerId, 'month');
    recentJobs.sort((a, b) => {
      const dateA = b.completedAt || b.preferredDate;
      const dateB = a.completedAt || a.preferredDate;
      return dateA.localeCompare(dateB);
    });

    // Get reviews
    const reviews = getReviewsByCleanerId(cleanerId);
    const reviewStats = calculateReviewStats(cleanerId);

    // Get complaints
    const complaints = getComplaintsByCleanerId(cleanerId);
    const complaintCount = complaints.length;
    const jobsWithComplaints = new Set(complaints.map(c => c.jobId)).size;
    const complaintRate = stats.totalJobs > 0
      ? (jobsWithComplaints / stats.totalJobs) * 100
      : 0;
    const latestComplaintRatings = complaints
      .slice(0, 3)
      .map(c => c.rating);

    // Get latest incentive
    const latestIncentive = getLatestIncentive(cleanerId);

    // Get average JQS
    const averageJQS = await getCleanerAverageJQS(cleanerId);
    
    // Count jobs with JQS
    const { prisma } = await import('../../../../lib/prisma');
    const totalJQSJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
        jobQualityScore: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        complaintCount,
        complaintRate,
        latestComplaintRatings,
        averageJQS,
        totalJQSJobs,
      },
      jobsByDay,
      recentJobs: recentJobs.slice(0, 20), // Last 20 jobs
      reviews: reviews.slice(0, 10), // Last 10 reviews
      reviewStats,
      complaints: complaints.slice(0, 5), // Last 5 complaints
      latestIncentive, // Current tier and bonus
    });
  } catch (error: any) {
    console.error('Get scorecard error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scorecard data' },
      { status: 500 }
    );
  }
}

