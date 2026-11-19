export const runtime = 'nodejs';
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
    await requireRole(request, "ADMIN");    // For now, allow access (should be protected in production)

    // Get all cleaners with training status (Jamaica branch only)
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        Branch_User_primaryBranchIdToBranch: {
          country: 'Jamaica', // Filter for Jamaica branch only
        },
      },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: {
            name: true,
            country: true,
          },
        },
        TrainingStatus: true,
        LessonProgress: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    // Get total number of lessons
    const totalLessons = await prisma.trainingLesson.count({
      where: {
        TrainingModule: {
          isActive: true,
        },
      },
    });

    // Map to response format
    const cleanersWithStatus = cleaners.map((cleaner) => ({
      cleanerId: cleaner.id,
      cleanerName: cleaner.name || 'Unknown',
      cleanerEmail: cleaner.email,
      branchName: cleaner.Branch_User_primaryBranchIdToBranch?.name || 'Unknown',
      branchCountry: cleaner.Branch_User_primaryBranchIdToBranch?.country || 'Unknown',
      overallStatus: cleaner.TrainingStatus?.overallStatus || 'NOT_STARTED',
      lastModuleSlug: cleaner.TrainingStatus?.lastModuleSlug || null,
      updatedAt: cleaner.TrainingStatus?.updatedAt || cleaner.updatedAt,
      completedLessons: cleaner.LessonProgress.length,
      totalLessons,
    }));

    return NextResponse.json({
      success: true,
      cleaners: cleanersWithStatus,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Get training status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training status' },
      { status: 500 }
    );
  }
}

