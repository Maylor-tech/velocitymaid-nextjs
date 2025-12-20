export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';

/**
 * GET /api/customer/jobs
 * 
 * List jobs for the authenticated customer
 * 
 * Query params:
 * - type: 'upcoming' | 'past' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CUSTOMER");
    const session = await getCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const now = new Date();

    // Build where clause
    const where: any = {
      customerId: session.customerId,
    };

    if (type === 'upcoming') {
      where.preferredDate = {
        gte: now,
      };
      where.status = {
        notIn: [JobStatus.CANCELLED, JobStatus.COMPLETED],
      };
    } else if (type === 'past') {
      where.OR = [
        { preferredDate: { lt: now } },
        { status: JobStatus.COMPLETED },
        { status: JobStatus.CANCELLED },
      ];
    }

    // Get jobs
    const jobs = await prisma.job.findMany({
      where,
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        CleanerRating: {
          select: {
            rating: true,
            comment: true,
          },
        },
      },
      orderBy: {
        preferredDate: type === 'upcoming' ? 'asc' : 'desc',
      },
    });

    // Format response
    const formattedJobs = jobs.map((job) => {
      // Determine payment status
      let paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL' = 'UNPAID';
      if (job.status === JobStatus.COMPLETED) {
        // TODO: Check actual payment status from Payment model if it exists
        // For now, assume unpaid if no payment link exists
        paymentStatus = 'UNPAID';
      }

      return {
        id: job.id,
        number: job.sessionId || undefined,
        status: job.status,
        serviceType: job.serviceType || undefined,
        scheduledDate: job.preferredDate?.toISOString() || undefined,
        timeWindow: job.preferredTime || undefined,
        address: job.address || job.serviceLocation || 'Address not provided',
        price: job.totalPrice ? Number(job.totalPrice) : null,
        branchName: job.Branch?.name || undefined,
        cleaner: job.User
          ? {
              id: job.User.id,
              name: job.User.name || 'Unknown',
              avatarUrl: undefined, // TODO: Add avatar URL if available
            }
          : null,
        paymentStatus,
        rating: job.CleanerRating
          ? {
              score: job.CleanerRating.rating,
              comment: job.CleanerRating.comment || undefined,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      count: formattedJobs.length,
    });
  } catch (error: any) {
    console.error('List customer jobs error:', error);
    
    // Handle Prisma connection errors specifically
    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please try again in a moment.',
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}


