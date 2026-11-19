import { requireRole } from "@/lib/auth/requireRole";
/**
 * Get Cleaner Training Detail API
 * GET /api/admin/training/[cleanerId]
 * 
 * Returns detailed training progress for a specific cleaner
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { cleanerId } = params;

    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: {
            name: true,
            country: true,
          },
        },
        TrainingStatus: true,
        LessonProgress: {
          include: {
            TrainingLesson: {
              include: {
                TrainingModule: {
                  select: {
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Get all lessons
    const allLessons = await prisma.trainingLesson.findMany({
      where: { TrainingModule: { isActive: true } },
      include: {
        TrainingModule: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { TrainingModule: { order: 'asc' } },
        { order: 'asc' },
      ],
    });

    // Map lessons with progress
    const lessonsWithProgress = allLessons.map((lesson) => {
      const progress = cleaner.LessonProgress.find((p) => p.lessonId === lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        status: (progress?.status || 'NOT_STARTED') as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
        score: progress?.score || null,
        moduleTitle: lesson.TrainingModule.title,
        moduleSlug: lesson.TrainingModule.slug,
      };
    });

    const completedLessons = cleaner.LessonProgress.filter((p) => p.status === 'COMPLETED').length;
    const totalLessons = allLessons.length;

    return NextResponse.json({
      success: true,
      detail: {
        cleanerId: cleaner.id,
        cleanerName: cleaner.name || 'Unknown',
        cleanerEmail: cleaner.email,
        branchName: cleaner.Branch_User_primaryBranchIdToBranch?.name || 'Unknown',
        overallStatus: cleaner.TrainingStatus?.overallStatus || 'NOT_STARTED',
        completedLessons,
        totalLessons,
        lessons: lessonsWithProgress,
      },
    });
  } catch (error) {
    console.error('Get training detail error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training details' },
      { status: 500 }
    );
  }
}


