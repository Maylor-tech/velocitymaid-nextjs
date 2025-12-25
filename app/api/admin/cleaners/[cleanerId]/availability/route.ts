export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/cleaners/[cleanerId]/availability
// Update cleaner availability (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { workingDays, timeRanges, maxDailyJobs, blackoutDates, isActive } = body;

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

    // Validate
    if (workingDays && (!Array.isArray(workingDays) || workingDays.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one working day is required' },
        { status: 400 }
      );
    }

    if (timeRanges && (!Array.isArray(timeRanges) || timeRanges.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one time range is required' },
        { status: 400 }
      );
    }

    // Validate time ranges
    if (timeRanges) {
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
    }

    if (maxDailyJobs !== undefined && (maxDailyJobs < 1 || maxDailyJobs > 10)) {
      return NextResponse.json(
        { success: false, error: 'Max daily jobs must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Get existing availability or use defaults
    const existing = await prisma.cleanerAvailability.findUnique({
      where: { cleanerId },
    });

    // Upsert availability
    const availability = await prisma.cleanerAvailability.upsert({
      where: { cleanerId },
      update: {
        ...(workingDays && { workingDays: workingDays as any }),
        ...(timeRanges && { timeRanges: timeRanges as any }),
        ...(maxDailyJobs !== undefined && { maxDailyJobs }),
        ...(blackoutDates !== undefined && { blackoutDates: blackoutDates as any }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      create: {
        cleanerId,
        workingDays: (workingDays || existing?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) as any,
        timeRanges: (timeRanges || existing?.timeRanges || [{ start: '09:00', end: '17:00' }]) as any,
        maxDailyJobs: maxDailyJobs ?? existing?.maxDailyJobs ?? 3,
        blackoutDates: (blackoutDates || existing?.blackoutDates || []) as any,
        isActive: isActive ?? existing?.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      availability: {
        workingDays: availability.workingDays as string[],
        timeRanges: availability.timeRanges as Array<{ start: string; end: string }>,
        maxDailyJobs: availability.maxDailyJobs,
        blackoutDates: (availability.blackoutDates as string[]) || [],
        isActive: availability.isActive,
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

// GET /api/admin/cleaners/[cleanerId]/availability
// Get cleaner availability (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    const availability = await prisma.cleanerAvailability.findUnique({
      where: { cleanerId },
    });

    if (!availability) {
      return NextResponse.json({
        success: true,
        availability: null,
      });
    }

    return NextResponse.json({
      success: true,
      availability: {
        workingDays: availability.workingDays as string[],
        timeRanges: availability.timeRanges as Array<{ start: string; end: string }>,
        maxDailyJobs: availability.maxDailyJobs,
        blackoutDates: (availability.blackoutDates as string[]) || [],
        isActive: availability.isActive,
      },
    });
  } catch (error: any) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get availability' },
      { status: 500 }
    );
  }
}

















