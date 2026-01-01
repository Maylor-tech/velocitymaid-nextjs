/**
 * Override Training Status API
 * POST /api/admin/training/[cleanerId]/override
 * 
 * Admin override to mark training as PASSED
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTrainingPassedNotification } from '@/app/services/trainingNotifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    // TODO: Add admin authentication check
    const { cleanerId } = params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'PASSED') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Only PASSED is supported.' },
        { status: 400 }
      );
    }

    // Update training status
    const trainingStatus = await prisma.trainingStatus.upsert({
      where: { cleanerId },
      update: {
        overallStatus: 'PASSED',
      },
      create: {
        cleanerId,
        overallStatus: 'PASSED',
      },
    });

    // Activate cleaner if training passed (Jamaica only)
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

    // Auto-generate certificate if training is PASSED
    try {
      const { createCertificate } = await import('@/utils/certificateGenerator');
      await createCertificate(cleanerId);
    } catch (certError) {
      console.error('Error creating certificate:', certError);
      // Don't fail the override if certificate creation fails
    }

    // Send notification (non-blocking)
    try {
      const cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
      });

      if (cleaner) {
        const application = await prisma.cleanerApplication.findFirst({
          where: { email: cleaner.email },
          orderBy: { createdAt: 'desc' },
        });

        const whatsappPhone = application?.whatsappNumber || application?.phone;
        if (whatsappPhone) {
          await sendTrainingPassedNotification(cleanerId, whatsappPhone);
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the override
    }

    return NextResponse.json({
      success: true,
      trainingStatus,
    });
  } catch (error: any) {
    console.error('Override training status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to override training status' },
      { status: 500 }
    );
  }
}

