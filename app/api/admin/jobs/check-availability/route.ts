export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Check Cleaner Availability API
 * POST /api/admin/jobs/check-availability
 * 
 * Checks if a cleaner is available for a specific job date/time
 * Body: { cleanerId: string, preferredDate: string, preferredTime: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { cleanerId, preferredDate, preferredTime } = body;

    if (!cleanerId || !preferredDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'cleanerId and preferredDate are required',
        },
        { status: 400 }
      );
    }

    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        availability: true,
      },
    });

    if (!cleaner) {
      return NextResponse.json({
        available: false,
        reason: 'Cleaner not found',
      });
    }

    if (!cleaner.isActive) {
      return NextResponse.json({
        available: false,
        reason: 'Cleaner is inactive',
      });
    }

    const availability = cleaner.availability;

    if (!availability || !availability.isActive) {
      return NextResponse.json({
        available: false,
        reason: 'No availability configured',
      });
    }

    const jobDate = new Date(preferredDate);
    const workingDays = availability.workingDays as string[];
    const timeRanges = availability.timeRanges as Array<{ start: string; end: string }>;
    const blackoutDates = (availability.blackoutDates as string[]) || [];

    // Check working day
    const dayName = jobDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!workingDays.includes(dayName)) {
      return NextResponse.json({
        available: false,
        reason: `Not available on ${dayName}`,
      });
    }

    // Check blackout dates
    const jobDateStr = jobDate.toISOString().split('T')[0];
    if (blackoutDates.includes(jobDateStr)) {
      return NextResponse.json({
        available: false,
        reason: 'Blackout date',
      });
    }

    // Check time range if preferredTime is provided
    if (preferredTime && timeRanges.length > 0) {
      // Parse preferredTime to get hour
      let jobHour: number | null = null;
      const timeMatch = preferredTime.match(/(\d+):?\d*\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const period = timeMatch[2].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        jobHour = hour;
      } else {
        const hour24Match = preferredTime.match(/(\d+):/);
        if (hour24Match) {
          jobHour = parseInt(hour24Match[1]);
        }
      }

      if (jobHour !== null) {
        let timeMatches = false;
        for (const range of timeRanges) {
          const rangeStart = parseInt(range.start.split(':')[0]);
          const rangeEnd = parseInt(range.end.split(':')[0]);
          if (rangeStart <= rangeEnd) {
            if (jobHour >= rangeStart && jobHour < rangeEnd) {
              timeMatches = true;
              break;
            }
          } else {
            if (jobHour >= rangeStart || jobHour < rangeEnd) {
              timeMatches = true;
              break;
            }
          }
        }
        if (!timeMatches) {
          return NextResponse.json({
            available: false,
            reason: 'Outside available time range',
          });
        }
      }
    }

    // Check max daily jobs
    const dayStart = new Date(jobDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(jobDate);
    dayEnd.setHours(23, 59, 59, 999);

    const jobsOnDate = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['cancelled', 'completed', 'DECLINED'],
        },
      },
    });

    if (jobsOnDate >= availability.maxDailyJobs) {
      return NextResponse.json({
        available: false,
        reason: `Max daily jobs (${availability.maxDailyJobs}) reached`,
      });
    }

    // Check for time slot conflicts
    if (preferredTime) {
      const sameDayJobs = await prisma.job.findMany({
        where: {
          assignedCleanerId: cleanerId,
          preferredDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            notIn: ['cancelled', 'completed', 'DECLINED'],
          },
        },
        select: {
          preferredTime: true,
        },
      });

      for (const existingJob of sameDayJobs) {
        if (existingJob.preferredTime === preferredTime) {
          return NextResponse.json({
            available: false,
            conflict: `Already booked at ${preferredTime}`,
          });
        }
      }
    }

    return NextResponse.json({
      available: true,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Error checking availability:', error);
    return NextResponse.json(
      {
        available: false,
        reason: error.message || 'Error checking availability',
      },
      { status: 500 }
    );
  }
}

