export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
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
    // Verify authentication and get session
    const auth = await requireRole(request, "CUSTOMER");
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found after authentication' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const now = new Date();

    // Build where clause
    // 🔐 PHASE M POLICY: Customers only see PAID jobs (payment enforcement)
    const baseWhere = {
      customerId: session.customerId,
      paymentStatus: PaymentStatus.PAID, // Only show paid jobs - aligns with payment-first philosophy
    };

    let where: any = { ...baseWhere };

    if (type === 'upcoming') {
      where = {
        ...baseWhere,
        preferredDate: {
          gte: now,
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      };
    } else if (type === 'past') {
      where = {
        ...baseWhere,
        OR: [
          { preferredDate: { lt: now } },
          { status: 'completed' },
          { status: 'cancelled' },
        ],
      };
    }

    // Get jobs
    let jobs = [];
    try {
      jobs = await prisma.job.findMany({
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
        // Handle null preferredDate gracefully - jobs without dates will appear last
      });
    } catch (e) {
      console.error('job.findMany failed', e);
      return NextResponse.json({ success: true, jobs: [], count: 0 });
    }

    // Format response
    const formattedJobs = jobs.map((job) => {
      // 🔐 PAYMENT TRUTH: Use actual paymentStatus from database (Stripe → webhook → DB)
      // Do NOT infer from job status - payment truth comes from Stripe
      const paymentStatus =
        job.paymentStatus === PaymentStatus.PAID
          ? 'PAID'
          : job.paymentStatus === PaymentStatus.REFUNDED
          ? 'REFUNDED'
          : job.paymentStatus === PaymentStatus.FAILED
          ? 'UNPAID'
          : 'UNPAID'; // PENDING or other → UNPAID

      // Generate human-friendly job number
      // Format: VM-XXXXXX (last 6 chars of job ID for now)
      // TODO: Add jobNumber field to Job model for better UX
      const jobNumber = job.id ? `VM-${job.id.slice(-6).toUpperCase()}` : undefined;

      return {
        id: job.id,
        number: jobNumber, // Human-friendly job number instead of raw sessionId
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
        paymentStatus, // Now reflects actual database payment status
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


