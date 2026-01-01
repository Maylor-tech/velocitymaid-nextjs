export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';

/**
 * POST /api/customer/jobs/[jobId]/rate
 * 
 * Rate a completed job
 * 
 * Body: { rating: number (1-5), comment?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    const session = await getCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        CleanerRating: true,
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
        { status: 403 }
      );
    }

    // Check if job is completed
    if (job.status !== JobStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'Can only rate completed jobs' },
        { status: 400 }
      );
    }

    // Check if cleaner is assigned
    if (!job.assignedCleanerId) {
      return NextResponse.json(
        { success: false, error: 'Job has no assigned cleaner' },
        { status: 400 }
      );
    }

    // Create or update rating
    const ratingRecord = await prisma.cleanerRating.upsert({
      where: { jobId: params.jobId },
      create: {
        jobId: params.jobId,
        cleanerId: job.assignedCleanerId,
        customerId: session.customerId,
        rating: Math.round(rating),
        comment: comment || null,
      },
      update: {
        rating: Math.round(rating),
        comment: comment || null,
      },
    });

    // Update job quality score
    await prisma.job.update({
      where: { id: params.jobId },
      data: {
        jobQualityScore: Math.round(rating) * 20, // Convert 1-5 to 0-100 scale
      },
    });

    return NextResponse.json({
      success: true,
      rating: {
        id: ratingRecord.id,
        score: ratingRecord.rating,
        comment: ratingRecord.comment || undefined,
      },
    });
  } catch (error: any) {
    console.error('Rate job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit rating',
      },
      { status: 500 }
    );
  }
}


