/**
 * Start Lesson API
 * POST /api/training/lesson/[lessonId]/start
 * 
 * Marks a lesson as IN_PROGRESS for the current cleaner
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { lessonId } = params;

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

    // Verify lesson exists
    const lesson = await prisma.trainingLesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Upsert lesson progress
    const existing = await prisma.lessonProgress.findFirst({
      where: {
        cleanerId,
        lessonId,
      },
    });

    const progress = existing
      ? await prisma.lessonProgress.update({
          where: { id: existing.id },
          data: { status: 'IN_PROGRESS' },
        })
      : await prisma.lessonProgress.create({
          data: {
            cleanerId,
            lessonId,
            status: 'IN_PROGRESS',
          },
        });

    // Update or create training status
    await prisma.trainingStatus.upsert({
      where: { cleanerId },
      update: {
        overallStatus: 'IN_PROGRESS',
        lastModuleSlug: lesson.module.slug,
      },
      create: {
        cleanerId,
        overallStatus: 'IN_PROGRESS',
        lastModuleSlug: lesson.module.slug,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: any) {
    console.error('Start lesson error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start lesson' },
      { status: 500 }
    );
  }
}

