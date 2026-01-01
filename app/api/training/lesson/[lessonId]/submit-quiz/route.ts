/**
 * Submit Quiz API
 * POST /api/training/lesson/[lessonId]/submit-quiz
 * 
 * Submits quiz answers, calculates score, and updates lesson progress
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  sendFirstModuleCompletedNotification,
  sendAllModulesCompletedNotification,
} from '@/app/services/trainingNotifications';

interface QuizSubmission {
  answers: number[]; // Array of selected answer indices
}

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
    const body: QuizSubmission = await request.json();
    const { answers } = body;

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

    // Get lesson with quiz data
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

    if (!lesson.quizJson) {
      return NextResponse.json(
        { success: false, error: 'This lesson does not have a quiz' },
        { status: 400 }
      );
    }

    const quizData = lesson.quizJson as { questions: Array<{ correctAnswer: number }> };

    // Calculate score
    let correct = 0;
    const totalQuestions = quizData.questions.length;

    if (answers.length !== totalQuestions) {
      return NextResponse.json(
        { success: false, error: 'Number of answers does not match number of questions' },
        { status: 400 }
      );
    }

    answers.forEach((answer, index) => {
      if (quizData.questions[index] && answer === quizData.questions[index].correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / totalQuestions) * 100);
    const passingScore = 70;
    const passed = score >= passingScore;

    // Update lesson progress
    const existing = await prisma.lessonProgress.findFirst({
      where: {
        cleanerId,
        lessonId,
      },
    });

    const progress = existing
      ? await prisma.lessonProgress.update({
          where: { id: existing.id },
          data: {
            status: passed ? 'COMPLETED' : 'IN_PROGRESS',
            score,
            completedAt: passed ? new Date() : null,
          },
        })
      : await prisma.lessonProgress.create({
          data: {
            cleanerId,
            lessonId,
            status: passed ? 'COMPLETED' : 'IN_PROGRESS',
            score,
            completedAt: passed ? new Date() : null,
          },
        });

    // Recalculate overall training status
    const allLessons = await prisma.trainingLesson.findMany({
      where: { module: { isActive: true } },
    });

    const allProgress = await prisma.lessonProgress.findMany({
      where: { cleanerId },
    });

    const completedCount = allProgress.filter((p) => p.status === 'COMPLETED').length;
    const totalCount = allLessons.length;
    const allCompleted = completedCount === totalCount && totalCount > 0;

    // Update training status
    const trainingStatus = await prisma.trainingStatus.upsert({
      where: { cleanerId },
      update: {
        overallStatus: allCompleted ? 'PASSED' : 'IN_PROGRESS',
        lastModuleSlug: lesson.module.slug,
      },
      create: {
        cleanerId,
        overallStatus: allCompleted ? 'PASSED' : 'IN_PROGRESS',
        lastModuleSlug: lesson.module.slug,
      },
    });

    // Activate cleaner if training passed (Jamaica only)
    if (allCompleted && trainingStatus.overallStatus === 'PASSED') {
      const cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
        include: {
          primaryBranch: {
            select: {
              country: true,
              slug: true,
            },
          },
        },
      });

      const isJamaicaBranch =
        cleaner?.primaryBranch?.country === 'Jamaica' ||
        cleaner?.primaryBranch?.country === 'JM' ||
        cleaner?.primaryBranch?.slug === 'port-antonio';

      if (isJamaicaBranch && cleaner) {
        await prisma.user.update({
          where: { id: cleanerId },
          data: { isActive: true },
        });
      }
    }

    // Auto-generate certificate if all modules completed
    if (allCompleted) {
      try {
        const { createCertificate } = await import('@/utils/certificateGenerator');
        await createCertificate(cleanerId);
      } catch (certError) {
        console.error('Error creating certificate:', certError);
        // Don't fail the quiz submission if certificate creation fails
      }
    }

    // Send WhatsApp notifications (non-blocking)
    if (passed && allCompleted) {
      // All modules completed
      try {
        const cleaner = await prisma.user.findUnique({
          where: { id: cleanerId },
          include: {
            primaryBranch: {
              select: { country: true, slug: true },
            },
          },
        });

        if (cleaner) {
          const isJamaicaBranch =
            cleaner.primaryBranch?.country === 'Jamaica' ||
            cleaner.primaryBranch?.country === 'JM' ||
            cleaner.primaryBranch?.slug === 'port-antonio';

          if (isJamaicaBranch) {
            const application = await prisma.cleanerApplication.findFirst({
              where: { email: cleaner.email },
              orderBy: { createdAt: 'desc' },
            });

            if (application?.phone) {
              await sendAllModulesCompletedNotification(cleanerId, application.phone);
            }
          }
        }
      } catch (error) {
        console.error('Error sending completion notification:', error);
        // Don't fail the quiz submission
      }
    } else if (passed) {
      // Check if this is the first module completed
      try {
        const moduleProgress = await prisma.lessonProgress.findMany({
          where: {
            cleanerId,
            status: 'COMPLETED',
          },
          include: {
            lesson: {
              include: {
                module: true,
              },
            },
          },
        });

        // Count unique modules completed
        const completedModules = new Set(
          moduleProgress.map((p) => p.lesson.moduleId)
        );

        if (completedModules.size === 1) {
          // First module completed
          const cleaner = await prisma.user.findUnique({
            where: { id: cleanerId },
            include: {
              primaryBranch: {
                select: { country: true, slug: true },
              },
            },
          });

          if (cleaner) {
            const isJamaicaBranch =
              cleaner.primaryBranch?.country === 'Jamaica' ||
              cleaner.primaryBranch?.country === 'JM' ||
              cleaner.primaryBranch?.slug === 'port-antonio';

            if (isJamaicaBranch) {
              const application = await prisma.cleanerApplication.findFirst({
                where: { email: cleaner.email },
                orderBy: { createdAt: 'desc' },
              });

              if (application?.phone) {
                const module = await prisma.trainingModule.findUnique({
                  where: { id: lesson.moduleId },
                });
                if (module) {
                  await sendFirstModuleCompletedNotification(
                    cleanerId,
                    application.phone,
                    module.title
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking first module completion:', error);
        // Don't fail the quiz submission
      }
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      correct,
      total: totalQuestions,
      progress,
      message: passed
        ? 'Congratulations! You passed the quiz.'
        : `You scored ${score}%. You need ${passingScore}% to pass. Please review the lesson and try again.`,
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

