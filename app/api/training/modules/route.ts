/**
 * Get Training Modules API
 * GET /api/training/modules
 * 
 * Returns all active training modules with progress for the current cleaner
 */

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

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 401 }
      );
    }

    // Get all active modules with lessons
    const modules = await prisma.trainingModule.findMany({
      where: { isActive: true },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Get cleaner's progress
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { cleanerId },
    });

    // Get training status
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    // Map modules with progress
    const modulesWithProgress = modules.map((module) => {
      const moduleLessons = module.lessons.map((lesson) => {
        const progress = progressRecords.find((p) => p.lessonId === lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          status: progress?.status || 'NOT_STARTED',
          score: progress?.score || null,
          completedAt: progress?.completedAt || null,
        };
      });

      const completedLessons = moduleLessons.filter((l) => l.status === 'COMPLETED').length;
      const totalLessons = moduleLessons.length;
      const moduleStatus =
        completedLessons === totalLessons && totalLessons > 0
          ? 'COMPLETED'
          : completedLessons > 0
          ? 'IN_PROGRESS'
          : 'NOT_STARTED';

      return {
        id: module.id,
        slug: module.slug,
        title: module.title,
        description: module.description,
        order: module.order,
        status: moduleStatus,
        lessons: moduleLessons,
        progress: {
          completed: completedLessons,
          total: totalLessons,
        },
      };
    });

    return NextResponse.json({
      success: true,
      modules: modulesWithProgress,
      trainingStatus: trainingStatus
        ? {
            overallStatus: trainingStatus.overallStatus,
            lastModuleSlug: trainingStatus.lastModuleSlug,
            updatedAt: trainingStatus.updatedAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Get training modules error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training modules' },
      { status: 500 }
    );
  }
}

