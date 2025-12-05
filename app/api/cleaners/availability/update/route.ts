export const dynamic = 'force-dynamic';

/**
 * Update Cleaner Availability API
 * POST /api/cleaners/availability/update
 * 
 * Creates or updates cleaner availability settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface AvailabilityUpdate {
  workingDays: string[];
  timeRanges: Array<{ start: string; end: string }>;
  maxDailyJobs: number;
  blackoutDates: string[];
}

export async function POST(request: NextRequest) {
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
        { status: 404 }
      );
    }

    const body: AvailabilityUpdate = await request.json();
    const { workingDays, timeRanges, maxDailyJobs, blackoutDates } = body;

    // Validate
    if (!workingDays || workingDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one working day is required' },
        { status: 400 }
      );
    }

    if (!timeRanges || timeRanges.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one time range is required' },
        { status: 400 }
      );
    }

    // Validate time ranges
    for (const range of timeRanges) {
      if (!range.start || !range.end) {
        return NextResponse.json(
          { success: false, error: 'All time ranges must have start and end times' },
          { status: 400 }
        );
      }
      if (range.start >= range.end) {
        return NextResponse.json(
          { success: false, error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    if (maxDailyJobs < 1 || maxDailyJobs > 10) {
      return NextResponse.json(
        { success: false, error: 'Max daily jobs must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Upsert availability
    const availability = await prisma.cleanerAvailability.upsert({
      where: { cleanerId },
      update: {
        workingDays: workingDays as any,
        timeRanges: timeRanges as any,
        maxDailyJobs,
        blackoutDates: blackoutDates as any,
        isActive: true,
      },
      create: {
        cleanerId,
        workingDays: workingDays as any,
        timeRanges: timeRanges as any,
        maxDailyJobs,
        blackoutDates: blackoutDates as any,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      availability: {
        workingDays: availability.workingDays as string[],
        timeRanges: availability.timeRanges as Array<{ start: string; end: string }>,
        maxDailyJobs: availability.maxDailyJobs,
        blackoutDates: availability.blackoutDates as string[] || [],
      },
    });
  } catch (error: any) {
    console.error('Update availability error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update availability' },
      { status: 500 }
    );
  }
}

