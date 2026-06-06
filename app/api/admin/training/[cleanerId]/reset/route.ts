/**
 * Reset Training API
 * POST /api/admin/training/[cleanerId]/reset
 * 
 * Resets all training progress for a cleaner
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { cleanerId } = params;

    // Delete all lesson progress
    await prisma.lessonProgress.deleteMany({
      where: { cleanerId },
    });

    // Reset training status
    await prisma.trainingStatus.update({
      where: { cleanerId },
      data: {
        overallStatus: 'NOT_STARTED',
        lastModuleSlug: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Training progress reset successfully',
    });
  } catch (error: any) {
    console.error('Reset training error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset training' },
      { status: 500 }
    );
  }
}


