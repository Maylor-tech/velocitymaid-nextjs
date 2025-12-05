export const dynamic = 'force-dynamic';

/**
 * Get Training Progress API
 * GET /api/training/progress
 * 
 * Returns training progress summary for the current cleaner
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify cleaner exists and get branch info
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        primaryBranch: {
          select: {
            id: true,
            name: true,
            country: true,
            slug: true,
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 401 }
      );
    }

    // Check if cleaner is in Jamaica branch
    const isJamaicaBranch =
      cleaner.primaryBranch?.country === 'Jamaica' ||
      cleaner.primaryBranch?.country === 'JM' ||
      cleaner.primaryBranch?.slug === 'port-antonio';

    if (!isJamaicaBranch) {
      return NextResponse.json({
        success: true,
        showTraining: false,
        message: 'Training is only available for Jamaica branch cleaners',
      });
    }

    // Get training status
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    // Get all lessons and progress
    const allLessons = await prisma.trainingLesson.findMany({
      where: { module: { isActive: true } },
    });

    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        cleanerId,
        status: 'COMPLETED',
      },
    });

    const totalLessons = allLessons.length;
    const completedLessons = completedProgress.length;
    const overallStatus = trainingStatus?.overallStatus || 'NOT_STARTED';
    const isCertified = overallStatus === 'PASSED';

    // Get certificate if exists
    const certificate = await prisma.trainingCertificate.findUnique({
      where: { cleanerId },
      select: { certificateId: true },
    });

    return NextResponse.json({
      success: true,
      showTraining: true,
      progress: {
        completed: completedLessons,
        total: totalLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
      overallStatus,
      isCertified,
      certificateId: certificate?.certificateId || null,
      trainingUrl: '/cleaners/training',
    });
  } catch (error: any) {
    console.error('Get training progress error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training progress' },
      { status: 500 }
    );
  }
}

