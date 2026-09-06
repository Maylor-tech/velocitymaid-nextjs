export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Training Reminders Cron Job
 * GET /api/cron/training/reminders
 * 
 * Checks for cleaners who haven't started training within 24 hours
 * and sends reminder notifications
 * 
 * Should be called daily via cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAndSendTrainingReminder } from '@/app/services/trainingNotifications';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all cleaners in Jamaica branch who haven't started training
    const jamaicaBranches = await prisma.branch.findMany({
      where: {
        country: { in: ['Jamaica', 'JM'] },
      },
      select: { id: true },
    });
    const jamaicaBranchIds = jamaicaBranches.map((b) => b.id);

    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        primaryBranchId: { in: jamaicaBranchIds },
        TrainingStatus: {
          overallStatus: 'NOT_STARTED',
        },
      },
      include: {
        TrainingStatus: true,
      },
    });

    let remindersSent = 0;
    let errors = 0;

    for (const cleaner of cleaners) {
      try {
        await checkAndSendTrainingReminder(cleaner.id);
        remindersSent++;
      } catch (error) {
        console.error(`Error sending reminder to cleaner ${cleaner.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Training reminders processed',
      cleanersChecked: cleaners.length,
      remindersSent,
      errors,
    });
  } catch (error: unknown) {
    console.error('Training reminders cron error:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : undefined) || 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

