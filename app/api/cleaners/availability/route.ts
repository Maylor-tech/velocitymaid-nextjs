/**
 * Get Cleaner Availability API
 * GET /api/cleaners/availability
 * 
 * Returns the cleaner's current availability settings
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

    const availability = await prisma.cleanerAvailability.findUnique({
      where: { cleanerId },
    });

    if (!availability) {
      return NextResponse.json({
        success: true,
        availability: null,
        message: 'No availability settings found. You can create one by updating your availability.',
      });
    }

    return NextResponse.json({
      success: true,
      availability: {
        workingDays: availability.workingDays as string[],
        timeRanges: availability.timeRanges as Array<{ start: string; end: string }>,
        maxDailyJobs: availability.maxDailyJobs,
        blackoutDates: availability.blackoutDates as string[] || [],
        isActive: availability.isActive,
      },
    });
  } catch (error: any) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

