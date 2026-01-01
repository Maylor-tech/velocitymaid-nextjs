export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create/Update Cleaner Rating API
 * POST /api/ratings/cleaner
 * 
 * Body: { jobId: string, cleanerId: string, rating: number (1-5), comment?: string }
 * 
 * Creates or updates a cleaner rating for a job
 * Optionally syncs jobQualityScore = rating * 20
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, cleanerId, rating, comment } = body;

    // Validate required fields
    if (!jobId || !cleanerId || !rating) {
      return NextResponse.json(
        {
          success: false,
          error: 'jobId, cleanerId, and rating are required',
        },
        { status: 400 }
      );
    }

    // Validate and clamp rating (1-5)
    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

    // Verify job exists and is assigned to this cleaner
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        assignedCleanerId: true,
        customerId: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job is not assigned to this cleaner',
        },
        { status: 403 }
      );
    }

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner not found',
        },
        { status: 404 }
      );
    }

    // Create or update rating
    const ratingRecord = await prisma.cleanerRating.upsert({
      where: { jobId },
      create: {
        jobId,
        cleanerId,
        customerId: job.customerId || null,
        rating: clampedRating,
        comment: comment || null,
      },
      update: {
        rating: clampedRating,
        comment: comment || null,
      },
    });

    // Optionally sync jobQualityScore = rating * 20
    const jobQualityScore = clampedRating * 20;
    await prisma.job.update({
      where: { id: jobId },
      data: { jobQualityScore },
    }).catch((error) => {
      // Don't fail if jobQualityScore update fails
      console.error('Error updating jobQualityScore:', error);
    });

    return NextResponse.json({
      success: true,
      rating: ratingRecord,
    });
  } catch (error: any) {
    console.error('Error creating/updating cleaner rating:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create/update rating',
      },
      { status: 500 }
    );
  }
}

