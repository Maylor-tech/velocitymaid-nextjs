export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';

/**
 * GET /api/customer/jobs/[jobId]
 * 
 * Get detailed job information for a specific job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    const session = await readCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    // Validate jobId
    if (!params.jobId || typeof params.jobId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
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
            createdAt: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to customer
    if (job.customerId !== session.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 404 } // Return 404 instead of 403 to hide existence
      );
    }

    // Calculate cleaner average rating if cleaner is assigned
    let cleanerAverageRating: number | null = null;
    if (job.assignedCleanerId) {
      const cleanerRatings = await prisma.cleanerRating.findMany({
        where: { cleanerId: job.assignedCleanerId },
        select: { rating: true },
      });
      
      if (cleanerRatings.length > 0) {
        cleanerAverageRating =
          cleanerRatings.reduce((sum, r) => sum + r.rating, 0) / cleanerRatings.length;
      }
    }

    // Calculate pricing breakdown
    const subtotal = job.totalPrice ? Number(job.totalPrice) : null;
    const fees = 0; // TODO: Calculate fees if applicable
    const total = subtotal !== null ? subtotal + fees : null;

    // Determine payment status
    let paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL' = 'UNPAID';
    // TODO: Check Payment model if it exists

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        date: job.preferredDate?.toISOString() || null,
        startTime: job.preferredTime || null,
        duration: null, // TODO: Add duration field to Job model if needed
        address: job.address || job.serviceLocation || 'Address not provided',
        status: job.status,
        subtotal,
        fees,
        total,
        notes: null, // TODO: Add customerNotes field to Job model if needed
        cleaner: job.User
          ? {
              id: job.User.id,
              name: job.User.name || 'Unknown',
              averageRating: cleanerAverageRating,
            }
          : null,
        // Additional fields for compatibility
        number: job.sessionId || undefined,
        serviceType: job.serviceType || undefined,
        scheduledDate: job.preferredDate?.toISOString() || undefined,
        timeWindow: job.preferredTime || undefined,
        price: job.totalPrice ? Number(job.totalPrice) : null,
        currency: job.currency || 'USD',
        branchName: job.Branch?.name || undefined,
        paymentStatus,
        rating: job.CleanerRating
          ? {
              score: job.CleanerRating.rating,
              comment: job.CleanerRating.comment || undefined,
            }
          : null,
        createdAt: job.createdAt.toISOString(),
        assignedAt: job.assignedAt?.toISOString() || undefined,
        onTheWayAt: job.onTheWayAt?.toISOString() || undefined,
        completedAt: job.completedAt?.toISOString() || undefined,
      },
    });
  } catch (error: any) {
    console.error('Get job details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch job details',
      },
      { status: 500 }
    );
  }
}


