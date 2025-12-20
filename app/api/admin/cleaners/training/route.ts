export const dynamic = 'force-dynamic'
/**
 * Get All Cleaners Training Status API
 * GET /api/admin/cleaners/training
 * 
 * Returns training status for all cleaners (Jamaica branch only for now)
 * Only accessible by ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check
    // For now, allow access (should be protected in production)

    // Get all cleaners with training status (Jamaica branch only)
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        primaryBranch: {
          country: 'Jamaica', // Filter for Jamaica branch only
        },
      },
      include: {
        primaryBranch: {
          select: {
            name: true,
            country: true,
          },
        },
        trainingStatus: true,
        lessonProgresses: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    // Get total number of lessons
    const totalLessons = await prisma.trainingLesson.count({
      where: {
        module: {
          isActive: true,
        },
      },
    });

    // Map to response format
    const cleanersWithStatus = cleaners.map((cleaner) => ({
      cleanerId: cleaner.id,
      cleanerName: cleaner.name || 'Unknown',
      cleanerEmail: cleaner.email,
      branchName: cleaner.primaryBranch?.name || 'Unknown',
      branchCountry: cleaner.primaryBranch?.country || 'Unknown',
      overallStatus: cleaner.trainingStatus?.overallStatus || 'NOT_STARTED',
      lastModuleSlug: cleaner.trainingStatus?.lastModuleSlug || null,
      updatedAt: cleaner.trainingStatus?.updatedAt || cleaner.updatedAt,
      completedLessons: cleaner.lessonProgresses.length,
      totalLessons,
    }));

    return NextResponse.json({
      success: true,
      cleaners: cleanersWithStatus,
    });
  } catch (error: any) {
    console.error('Get training status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training status' },
      { status: 500 }
    );
  }
}


