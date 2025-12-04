export const dynamic = 'force-dynamic'
/**
 * Get Jobs for Scheduling API
 * GET /api/admin/schedule/jobs
 * 
 * Returns upcoming jobs with cleaner availability and eligibility info
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const days = parseInt(searchParams.get('days') || '14'); // Default 14 days ahead

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    // Build where clause
    const where: any = {
      preferredDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        notIn: ['cancelled', 'completed'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // Fetch jobs
    const jobs = await prisma.job.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
          },
        },
        assignedCleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranch: {
              select: {
                name: true,
                country: true,
              },
            },
            trainingStatus: {
              select: {
                overallStatus: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            preferSameCleaner: true,
          },
        },
      },
      orderBy: [
        { preferredDate: 'asc' },
        { preferredTime: 'asc' },
      ],
    });

    // Get Jamaica branches
    const jamaicaBranches = await prisma.branch.findMany({
      where: {
        OR: [
          { country: 'Jamaica' },
          { country: 'JM' },
          { slug: 'port-antonio' },
        ],
      },
      select: { id: true },
    });

    const jamaicaBranchIds = jamaicaBranches.map((b) => b.id);

    // Get all cleaners for Jamaica branches with availability
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        primaryBranchId: { in: jamaicaBranchIds },
      },
      include: {
        primaryBranch: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
        trainingStatus: {
          select: {
            overallStatus: true,
          },
        },
        availability: true,
      },
    });

    // For each job, find available cleaners
    const jobsWithCleaners = jobs.map((job) => {
      const isJamaicaJob = jamaicaBranchIds.includes(job.branchId);
      
      // Only show cleaner availability for Jamaica jobs
      const availableCleaners = isJamaicaJob
        ? cleaners
            .filter((cleaner) => {
              // Check training status
              if (cleaner.trainingStatus?.overallStatus !== 'PASSED') {
                return false;
              }

              // Check availability
              if (!cleaner.availability || !cleaner.availability.isActive) {
                return false;
              }

              const availability = cleaner.availability;
              const workingDays = availability.workingDays as string[];
              const timeRanges = availability.timeRanges as Array<{ start: string; end: string }>;
              const blackoutDates = (availability.blackoutDates as string[]) || [];

              // Check if job date is a working day
              if (job.preferredDate) {
                const jobDate = new Date(job.preferredDate);
                const dayName = jobDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                if (!workingDays.includes(dayName)) {
                  return false;
                }

                // Check blackout dates
                const jobDateStr = jobDate.toISOString().split('T')[0];
                if (blackoutDates.includes(jobDateStr)) {
                  return false;
                }
              }

              // Check time range (simplified - would need more complex logic for exact matching)
              // For now, just check if cleaner has any time ranges set
              if (timeRanges.length === 0) {
                return false;
              }

              // Check max daily jobs
              const jobsOnDate = jobs.filter(
                (j) =>
                  j.assignedCleanerId === cleaner.id &&
                  j.preferredDate &&
                  job.preferredDate &&
                  new Date(j.preferredDate).toISOString().split('T')[0] ===
                    new Date(job.preferredDate).toISOString().split('T')[0]
              );
              if (jobsOnDate.length >= availability.maxDailyJobs) {
                return false;
              }

              return true;
            })
            .map((cleaner) => ({
              id: cleaner.id,
              name: cleaner.name || 'Unknown',
              email: cleaner.email,
              trainingStatus: cleaner.trainingStatus?.overallStatus || 'NOT_STARTED',
              hasAvailability: !!cleaner.availability,
            }))
        : [];

      return {
        id: job.id,
        customerName: job.customerName || (job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Unknown'),
        customerPhone: job.customer?.phone || null,
        preferredDate: job.preferredDate,
        preferredTime: job.preferredTime,
        serviceType: job.serviceType,
        address: job.address,
        status: job.status,
        totalPrice: job.totalPrice,
        currency: job.currency,
        assignedCleaner: job.assignedCleaner
          ? {
              id: job.assignedCleaner.id,
              name: job.assignedCleaner.name || 'Unknown',
              trainingStatus: job.assignedCleaner.trainingStatus?.overallStatus || 'NOT_STARTED',
            }
          : null,
        branch: {
          id: job.branch.id,
          name: job.branch.name,
          slug: job.branch.slug,
          country: job.branch.country,
        },
        customer: job.customer
          ? {
              id: job.customer.id,
              preferSameCleaner: job.customer.preferSameCleaner,
            }
          : null,
        availableCleaners: availableCleaners,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: jobsWithCleaners,
      count: jobsWithCleaners.length,
    });
  } catch (error: any) {
    console.error('Get schedule jobs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

