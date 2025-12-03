/**
 * Get Lesson Details API
 * GET /api/training/lesson/[lessonId]
 * 
 * Returns lesson details with content and quiz data
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Get lesson with module
    const lesson = await prisma.trainingLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            slug: true,
            title: true,
          },
        },
        progresses: {
          where: { cleanerId },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const progress = lesson.progresses[0];
    const status = progress?.status || 'NOT_STARTED';

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        quizJson: lesson.quizJson,
        module: lesson.module,
        status,
      },
    });
  } catch (error: any) {
    console.error('Get lesson error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

