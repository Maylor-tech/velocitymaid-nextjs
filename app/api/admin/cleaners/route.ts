export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * List Cleaners API
 * GET /api/admin/cleaners?branchId=xxx&jobId=xxx
 * 
 * Returns all cleaners for a branch with detailed availability and stats
 * If jobId is provided, checks availability against that specific job
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCleanerAverageJQS } from '@/utils/jobQualityScore';
import { computeAssignmentScore, CleanerForScoring } from '@/lib/assignment-scoring';
import { calculateCleanerLevel, CleanerLevelMetrics } from '@/lib/cleaner-level';
import { ACTIVE_JOB_STATUS_EXCLUDE } from '@/lib/jobStatus';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseStartTime(date: Date, time?: string | null): Date {
  if (!time) return date;
  const match = String(time).match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
  if (!match) return date;

  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;

  const d = new Date(date);
  d.setHours(hour, minutes, 0, 0);
  return d;
}

const JOB_DURATION_MS = 3 * 60 * 60 * 1000;

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

// Helper to get start of week (Sunday)
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of week (Saturday)
function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get('branchId');
    const jobId = searchParams.get('jobId');

    // Load job first when jobId provided — used for branch resolution and availability
    const job = jobId
      ? await prisma.job.findUnique({
          where: { id: jobId },
          select: {
            branchId: true,
            preferredDate: true,
            preferredTime: true,
            serviceLocation: true,
            jobQualityScore: true,
          },
        })
      : null;

    const branchId = auth.branchId ?? branchIdParam ?? job?.branchId ?? null;

    if (!branchId) {
      return NextResponse.json({
        success: true,
        cleaners: [],
        message: 'Provide branchId or jobId to list cleaners for assignment',
      });
    }

    const jobDate = job?.preferredDate ? new Date(job.preferredDate) : null;
    const jobTime = job?.preferredTime ?? null;

    // Get all approved cleaners in branch
    const cleanerApps = await prisma.cleanerApplication.findMany({
      where: {
        branchId,
        status: 'APPROVED',
      },
    });

    const cleaners = [];

    for (const cleanerApp of cleanerApps) {
      const user = await prisma.user.findUnique({
        where: {
          email: cleanerApp.email,
          role: 'CLEANER',
        },
        include: {
          CleanerAvailability: true,
          TrainingStatus: {
            select: {
              overallStatus: true,
            },
          },
        },
      });

      if (!user) continue;

      // Today / job day: assigned jobs and time-overlap (🟢 Available / 🟡 Busy / 🔴 Conflict)
      const todayStart = startOfToday();
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      let todayAvailability: 'AVAILABLE' | 'BUSY' | 'CONFLICT' = 'AVAILABLE';

      if (jobDate && jobTime) {
        // Job we're assigning to: check overlap on that day
        const jobStart = parseStartTime(new Date(jobDate), jobTime);
        const jobEnd = new Date(jobStart.getTime() + JOB_DURATION_MS);
        const jobDayStart = new Date(jobDate);
        jobDayStart.setHours(0, 0, 0, 0);
        const jobDayEnd = new Date(jobDayStart);
        jobDayEnd.setDate(jobDayEnd.getDate() + 1);

        const assignedOnJobDay = await prisma.job.findMany({
          where: {
            assignedCleanerId: user.id,
            status: 'ASSIGNED',
            preferredDate: {
              gte: jobDayStart,
              lt: jobDayEnd,
            },
          },
          select: { preferredDate: true, preferredTime: true },
        });

        let hasOverlap = false;
        for (const j of assignedOnJobDay) {
          const start = parseStartTime(j.preferredDate ? new Date(j.preferredDate) : jobDayStart, j.preferredTime);
          const end = new Date(start.getTime() + JOB_DURATION_MS);
          if (overlaps(jobStart, jobEnd, start, end)) {
            hasOverlap = true;
            break;
          }
        }
        todayAvailability = hasOverlap ? 'CONFLICT' : assignedOnJobDay.length > 0 ? 'BUSY' : 'AVAILABLE';
      } else {
        const assignedTodayCount = await prisma.job.count({
          where: {
            assignedCleanerId: user.id,
            status: 'ASSIGNED',
            preferredDate: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        });
        todayAvailability = assignedTodayCount > 0 ? 'BUSY' : 'AVAILABLE';
      }

      // Weekly job count
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const weeklyJobs = await prisma.job.count({
        where: {
          assignedCleanerId: user.id,
          preferredDate: {
            gte: weekStart,
            lte: weekEnd,
          },
          status: {
            notIn: ACTIVE_JOB_STATUS_EXCLUDE,
          },
        },
      });

      // Daily job count (if jobDate provided)
      let dailyJobs = 0;
      if (jobDate) {
        const dayStart = new Date(jobDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(jobDate);
        dayEnd.setHours(23, 59, 59, 999);

        dailyJobs = await prisma.job.count({
          where: {
            assignedCleanerId: user.id,
            preferredDate: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: {
              notIn: ACTIVE_JOB_STATUS_EXCLUDE,
            },
          },
        });
      }

      // Time conflict check
      let timeConflict = false;
      if (jobDate && jobTime) {
        const dayStart = new Date(jobDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(jobDate);
        dayEnd.setHours(23, 59, 59, 999);

        const existingJobs = await prisma.job.findMany({
          where: {
            assignedCleanerId: user.id,
            preferredDate: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: {
              notIn: ACTIVE_JOB_STATUS_EXCLUDE,
            },
          },
          select: {
            preferredTime: true,
          },
        });

        for (const existingJob of existingJobs) {
          if (existingJob.preferredTime === jobTime) {
            timeConflict = true;
            break;
          }
        }
      }

      // Availability check
      let availability = true;
      let reason = '';

      if (user.CleanerAvailability && jobDate) {
        const avail = user.CleanerAvailability;

        if (!avail.isActive) {
          availability = false;
          reason = 'Availability not active';
        } else {
          const workingDays = (avail.workingDays as string[]) || [];
          const dayName = jobDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

          if (!workingDays.includes(dayName)) {
            availability = false;
            reason = `Not available on ${dayName}`;
          }

          // Max daily jobs
          if (dailyJobs >= (avail.maxDailyJobs ?? 3)) {
            availability = false;
            reason = `Max daily jobs (${avail.maxDailyJobs}) reached`;
          }

          // Blackout dates
          const blackoutDates = (avail.blackoutDates as string[]) || [];
          const jobDateStr = jobDate.toISOString().split('T')[0];
          if (blackoutDates.includes(jobDateStr)) {
            availability = false;
            reason = 'Blackout date';
          }

          // Time range check
          if (jobTime && avail.timeRanges) {
            const timeRanges = avail.timeRanges as Array<{ start: string; end: string }>;
            let timeMatches = false;

            // Parse jobTime to get hour
            let jobHour: number | null = null;
            const timeMatch = jobTime.match(/(\d+):?\d*\s*(AM|PM)/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const period = timeMatch[2].toUpperCase();
              if (period === 'PM' && hour !== 12) hour += 12;
              if (period === 'AM' && hour === 12) hour = 0;
              jobHour = hour;
            } else {
              const hour24Match = jobTime.match(/(\d+):/);
              if (hour24Match) {
                jobHour = parseInt(hour24Match[1]);
              }
            }

            if (jobHour !== null && timeRanges.length > 0) {
              for (const range of timeRanges) {
                const rangeStart = parseInt(range.start.split(':')[0]);
                const rangeEnd = parseInt(range.end.split(':')[0]);
                if (rangeStart <= rangeEnd) {
                  if (jobHour >= rangeStart && jobHour < rangeEnd) {
                    timeMatches = true;
                    break;
                  }
                } else {
                  // Wrap-around case
                  if (jobHour >= rangeStart || jobHour < rangeEnd) {
                    timeMatches = true;
                    break;
                  }
                }
              }
              if (!timeMatches) {
                availability = false;
                reason = 'Outside available time range';
              }
            }
          }
        }
      } else if (jobDate && !user.CleanerAvailability) {
        availability = false;
        reason = 'No availability configured';
      }

      // Preferred city match (NJ)
      const preferredCityMatch =
        job?.serviceLocation &&
        user.preferredCities &&
        user.preferredCities.length > 0 &&
        user.preferredCities.includes(job.serviceLocation);

      // JQS score (use job's JQS if available, otherwise get cleaner average)
      let jqs = job?.jobQualityScore ?? null;
      if (jqs === null) {
        jqs = await getCleanerAverageJQS(user.id);
      }

      // Calculate match score (0-100)
      let matchScore = 0;

      // Hard gate: if not available, score = 0
      if (!availability) {
        matchScore = 0;
      } else {
        // Workload: max(0, 30 - weeklyJobs * 5), capped at 30
        const workloadScore = Math.max(0, 30 - Math.min(weeklyJobs, 6) * 5);
        matchScore += workloadScore;

        // No time conflict: +20 points
        if (!timeConflict) {
          matchScore += 20;
        } else {
          matchScore -= 40; // Heavy penalty for conflicts
        }

        // Preferred city match: +15 points
        if (preferredCityMatch) {
          matchScore += 15;
        }

        // Training status: +10 points for PASSED (especially for Jamaica)
        if (user.TrainingStatus?.overallStatus === 'PASSED') {
          matchScore += 10;
        }

        // JQS contribution: up to +25 points (jqs * 0.25)
        const jqsScore = Math.min((jqs || 0) * 0.25, 25);
        matchScore += jqsScore;
      }

      // Cap score between 0 and 100
      if (matchScore < 0) matchScore = 0;
      if (matchScore > 100) matchScore = 100;

      // Calculate cleaner level (Phase 4 Part B)
      let cleanerLevel = null;
      try {
        const allJobsForLevel = await prisma.job.findMany({
          where: { assignedCleanerId: user.id },
          orderBy: { createdAt: 'asc' },
        });

        const firstJob = allJobsForLevel[0];
        const daysSinceFirstJob = firstJob
          ? Math.floor(
              (new Date().getTime() - firstJob.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        const totalAssigned = allJobsForLevel.length;
        const completedCount = allJobsForLevel.filter((j) => j.status === JobStatus.COMPLETED).length;
        const completionRate = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;

        const ratings = await prisma.cleanerRating.findMany({
          where: { cleanerId: user.id },
        });
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : null;

        const metrics: CleanerLevelMetrics = {
          daysSinceFirstJob,
          totalJobs: totalAssigned,
          completedJobs: completedCount,
          averageRating: avgRating,
          completionRate,
          productivityScore: Math.min(100, (weeklyJobs / 8) * 100),
          complaintsCount: 0, // TODO: Get from complaints
        };

        cleanerLevel = calculateCleanerLevel(metrics);
      } catch (levelErr) {
        console.warn('Failed to calculate cleaner level:', levelErr);
      }

      // Calculate V3 assignment score
      const assignmentScore = job
        ? computeAssignmentScore(
            {
              id: user.id,
              name: user.name,
              availability,
              reason,
              timeConflict,
              level: cleanerLevel,
              trainingStatus: user.TrainingStatus?.overallStatus || null,
              rating: avgRating,
              completionRate,
              productivityScore: Math.min(100, (weeklyJobs / 8) * 100),
              preferredCityMatch: preferredCityMatch || false,
              dailyJobs,
              weeklyJobs,
              jqs: jqs || 0,
            },
            {
              id: job.id,
              preferredDate: jobDate,
              preferredTime: jobTime,
              serviceLocation: job.serviceLocation,
              address: job.address,
              branchId: job.branchId || branchId,
            }
          )
        : null;

      cleaners.push({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        isActive: user.isActive,
        availability,
        reason,
        todayAvailability,
        dailyJobs,
        weeklyJobs,
        preferredCityMatch: preferredCityMatch || false,
        trainingStatus: user.TrainingStatus?.overallStatus || null,
        jqs: jqs || 0,
        timeConflict,
        matchScore: Math.round(matchScore),
        // Phase 4 Part B: Add V3 assignment score
        assignmentScore: assignmentScore
          ? {
              total: assignmentScore.total,
              breakdown: assignmentScore.breakdown,
            }
          : null,
        level: cleanerLevel,
      });
    }

    // Sort by match score descending (best matches first)
    cleaners.sort((a, b) => {
      // Available cleaners first
      if (a.availability && !b.availability) return -1;
      if (!a.availability && b.availability) return 1;

      // Then by match score
      return b.matchScore - a.matchScore;
    });

    return NextResponse.json({
      success: true,
      cleaners,
      count: cleaners.length,
    });
  } catch (err: any) {
    console.error('CLEANER_LIST_ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch cleaners',
      },
      { status: 500 }
    );
  }
}
