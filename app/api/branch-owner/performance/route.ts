/**
 * GET /api/branch-owner/performance
 * 
 * Returns performance flags and metrics for branch
 * Internal only - not public
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "BRANCH_OWNER");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchId) {
      return NextResponse.json(
        { success: false, error: "Branch owner not assigned to a branch" },
        { status: 403 }
      );
    }

    const branchId = authResult.branchId;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Calculate cancellation rate
    const totalJobs = await prisma.job.count({
      where: {
        branchId,
        createdAt: {
          gte: monthAgo,
        },
      },
    });

    const cancelledJobs = await prisma.job.count({
      where: {
        branchId,
        status: "cancelled",
        createdAt: {
          gte: monthAgo,
        },
      },
    });

    const cancellationRate = totalJobs > 0 ? (cancelledJobs / totalJobs) * 100 : 0;
    const highCancellationRate = cancellationRate > 15; // Flag if > 15%

    // Check for repeated cleaner issues (cleaners with multiple low ratings)
    const cleanerIssues = await prisma.cleanerRating.groupBy({
      by: ["cleanerId"],
      where: {
        rating: {
          lt: 3, // Ratings below 3
        },
        Job: {
          branchId,
          completedAt: {
            gte: monthAgo,
          },
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 2, // More than 2 low ratings
          },
        },
      },
    });

    const cleanersWithIssues = await Promise.all(
      cleanerIssues.map(async (issue) => {
        const cleaner = await prisma.user.findUnique({
          where: { id: issue.cleanerId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        return {
          cleanerId: issue.cleanerId,
          cleanerName: cleaner?.name || cleaner?.email || "Unknown",
          lowRatingCount: issue._count.id,
        };
      })
    );

    // Check for slow response times (jobs assigned but not started within 24 hours)
    const slowResponseJobs = await prisma.job.findMany({
      where: {
        branchId,
        status: {
          in: ["assigned", "confirmed"],
        },
        assignedAt: {
          not: null,
        },
        preferredDate: {
          lte: new Date(), // Past or today
        },
      },
      select: {
        id: true,
        customerName: true,
        preferredDate: true,
        assignedAt: true,
      },
      take: 10,
    });

    const slowResponseCount = slowResponseJobs.filter((job) => {
      if (!job.assignedAt || !job.preferredDate) return false;
      const assignedDate = new Date(job.assignedAt);
      const preferredDate = new Date(job.preferredDate);
      const hoursDiff = (preferredDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24 && preferredDate <= new Date();
    }).length;

    // Average response time (hours from assignment to job date)
    const recentCompletedJobs = await prisma.job.findMany({
      where: {
        branchId,
        status: "completed",
        assignedAt: {
          not: null,
        },
        preferredDate: {
          not: null,
        },
        completedAt: {
          gte: monthAgo,
        },
      },
      select: {
        assignedAt: true,
        preferredDate: true,
      },
      take: 50,
    });

    const responseTimes = recentCompletedJobs
      .filter((job) => job.assignedAt && job.preferredDate)
      .map((job) => {
        const assigned = new Date(job.assignedAt!);
        const preferred = new Date(job.preferredDate!);
        return (preferred.getTime() - assigned.getTime()) / (1000 * 60 * 60); // Hours
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : null;

    // Jobs needing attention (pending/assigned past due)
    const jobsNeedingAttention = await prisma.job.count({
      where: {
        branchId,
        status: {
          in: ["pending", "assigned"],
        },
        preferredDate: {
          lte: now,
        },
      },
    });

    return NextResponse.json({
      success: true,
      performance: {
        cancellationRate: {
          value: Math.round(cancellationRate * 10) / 10,
          flagged: highCancellationRate,
          threshold: 15,
          totalJobs,
          cancelledJobs,
        },
        cleanerIssues: {
          flagged: cleanersWithIssues.length > 0,
          cleaners: cleanersWithIssues,
          count: cleanersWithIssues.length,
        },
        responseTime: {
          averageHours: avgResponseTime ? Math.round(avgResponseTime * 10) / 10 : null,
          slowResponseCount,
          flagged: slowResponseCount > 5 || (avgResponseTime !== null && avgResponseTime < 12),
        },
        jobsNeedingAttention: {
          count: jobsNeedingAttention,
          flagged: jobsNeedingAttention > 0,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_PERFORMANCE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch performance metrics",
      },
      { status: 500 }
    );
  }
}












