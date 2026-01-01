export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoAssignCleaner } from '@/lib/cleaner-assignment';

/**
 * Cron Job: Auto-assign unassigned jobs
 * 
 * GET /api/cron/assign-unassigned
 * 
 * Protected by CRON_SECRET header
 * 
 * Finds all Jobs where assignedCleanerId is null AND scheduledDate >= today
 * For each job, calls autoAssignCleaner()
 * Returns JSON summary: { processed, assigned, failed }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all unassigned jobs scheduled for today or later
    const unassignedJobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: null,
        preferredDate: {
          gte: today,
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      },
      orderBy: {
        preferredDate: 'asc', // Process earliest jobs first
      },
      take: 50, // Process up to 50 jobs per run
    });

    if (unassignedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        assigned: 0,
        failed: 0,
        message: 'No unassigned jobs found',
      });
    }

    // Process each job
    let assigned = 0;
    let failed = 0;
    const results: Array<{
      jobId: string;
      success: boolean;
      cleanerId?: string;
      reason?: string;
    }> = [];

    for (const job of unassignedJobs) {
      const result = await autoAssignCleaner(job.id);
      
      if (result.success) {
        assigned++;
      } else {
        failed++;
      }

      results.push({
        jobId: job.id,
        success: result.success,
        cleanerId: result.cleanerId,
        reason: result.reason,
      });
    }

    return NextResponse.json({
      success: true,
      processed: unassignedJobs.length,
      assigned,
      failed,
      results,
    });
  } catch (error: any) {
    console.error('Error in assign-unassigned cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

