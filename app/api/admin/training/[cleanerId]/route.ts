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
    // TODO: Add admin authentication check
    const { cleanerId } = params;

    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        primaryBranch: {
          select: {
            name: true,
            country: true,
          },
        },
        trainingStatus: true,
        lessonProgresses: {
          include: {
            lesson: {
              include: {
                module: {
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
      where: { module: { isActive: true } },
      include: {
        module: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { module: { order: 'asc' } },
        { order: 'asc' },
      ],
    });

    // Map lessons with progress
    const lessonsWithProgress = allLessons.map((lesson) => {
      const progress = cleaner.lessonProgresses.find((p) => p.lessonId === lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        status: (progress?.status || 'NOT_STARTED') as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
        score: progress?.score || null,
        moduleTitle: lesson.module.title,
        moduleSlug: lesson.module.slug,
      };
    });

    const completedLessons = cleaner.lessonProgresses.filter((p) => p.status === 'COMPLETED').length;
    const totalLessons = allLessons.length;

    return NextResponse.json({
      success: true,
      detail: {
        cleanerId: cleaner.id,
        cleanerName: cleaner.name || 'Unknown',
        cleanerEmail: cleaner.email,
        branchName: cleaner.primaryBranch?.name || 'Unknown',
        overallStatus: cleaner.trainingStatus?.overallStatus || 'NOT_STARTED',
        completedLessons,
        totalLessons,
        lessons: lessonsWithProgress,
      },
    });
  } catch (error: any) {
    console.error('Get training detail error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training details' },
      { status: 500 }
    );
  }
}


