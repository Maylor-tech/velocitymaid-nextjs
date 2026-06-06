export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from "@/lib/auth/requireRole";
import {
  getJobsToday,
  getJobsNext7Days,
  getRevenueLast7Days,
  getCleanerSchedules,
  getUnassignedJobs,
  getBookingFeed,
  getReminderStatus,
  getKPIStats,
  ServiceRegion,
} from '@/utils/dashboardQueries';
import { getAllReviews } from '@/utils/reviewData';
import { prisma } from '@/lib/prisma';

export const revalidate = 10; // Revalidate every 10 seconds

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const searchParams = request.nextUrl.searchParams;
    const regionParam = searchParams.get('region');
    
    const region: ServiceRegion = 
      regionParam === 'new_jersey' ? 'new_jersey' :
      regionParam === 'vermont' ? 'vermont' :
      null;

    // Fetch all data in parallel
    const [
      jobsToday,
      jobsNext7Days,
      revenueData,
      cleanerSchedules,
      unassignedJobs,
      bookingFeed,
      reminderStatus,
      kpiStats,
      reviews,
    ] = await Promise.all([
      getJobsToday(region),
      getJobsNext7Days(region),
      getRevenueLast7Days(region),
      getCleanerSchedules(region),
      getUnassignedJobs(region),
      getBookingFeed(region),
      getReminderStatus(region),
      getKPIStats(region),
      Promise.resolve(getAllReviews(region || undefined)),
    ]);

    // Find jobs missing confirmation
    const jobsMissingConfirmation = jobsNext7Days.filter(
      job => !job.confirmationSent && job.status !== 'cancelled' && job.status !== 'completed'
    );

    // Find jobs with invalid phone numbers (simplified check)
    const jobsWithInvalidPhone = jobsNext7Days.filter(
      job => !job.phone || !job.phone.startsWith('+') || job.phone.length < 10
    );

    // Get lead stats for New Jersey
    let leadStats = null;
    if (!region || region === 'new_jersey') {
      const njBranch = await prisma.branch.findUnique({
        where: { slug: 'new-jersey' },
      });

      if (njBranch) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const leadsThisWeek = await prisma.lead.count({
          where: {
            branchId: njBranch.id,
            createdAt: { gte: oneWeekAgo },
          },
        });

        const allLeads = await prisma.lead.findMany({
          where: {
            branchId: njBranch.id,
            createdAt: { gte: oneWeekAgo },
          },
        });

        const qualifiedLeads = await prisma.lead.count({
          where: {
            branchId: njBranch.id,
            createdAt: { gte: oneWeekAgo },
            status: 'QUALIFIED',
          },
        });

        leadStats = {
          leadsThisWeek,
          tierA: allLeads.filter(l => l.leadTier === 'A').length,
          tierB: allLeads.filter(l => l.leadTier === 'B').length,
          tierC: allLeads.filter(l => l.leadTier === 'C').length,
          conversionRate: leadsThisWeek > 0 ? (qualifiedLeads / leadsThisWeek) * 100 : 0,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        jobsToday,
        jobsNext7Days,
        revenueData,
        cleanerSchedules,
        unassignedJobs,
        bookingFeed,
        reminderStatus,
        jobsMissingConfirmation,
        jobsWithInvalidPhone,
        kpiStats,
        reviews: reviews.slice(0, 20), // Latest 20 reviews
        leadStats,
      },
      region,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}

