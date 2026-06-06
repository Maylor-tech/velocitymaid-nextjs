/**
 * GET /api/branch-owner/dashboard
 * 
 * Returns operational metrics for branch owner dashboard
 * NO financial data - only counts and statuses
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Authenticate as branch owner
    await requireRole(request, "BRANCH_OWNER");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchId) {
      return NextResponse.json(
        { success: false, error: "Branch owner not assigned to a branch" },
        { status: 403 }
      );
    }

    const branchId = authResult.branchId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Jobs today (count only)
    const jobsToday = await prisma.job.count({
      where: {
        branchId,
        preferredDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Jobs this week (count only)
    const jobsThisWeek = await prisma.job.count({
      where: {
        branchId,
        preferredDate: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    // Active cleaners (count only)
    const activeCleaners = await prisma.user.count({
      where: {
        role: "CLEANER",
        isActive: true,
        UserBranch: {
          some: {
            branchId,
          },
        },
      },
    });

    // Jobs needing attention (RECEIVED, ASSIGNED but not started)
    // Note: Using uppercase enum values from JobStatus enum
    const jobsNeedingAttention = await prisma.job.count({
      where: {
        branchId,
        status: {
          in: ["RECEIVED", "ASSIGNED", "CONFIRMED"], // Use enum values, not lowercase strings
        },
        preferredDate: {
          lte: tomorrow, // Today or past
        },
      },
    });

    // Customer issues (count only - from complaints or low ratings)
    // Note: This assumes a Complaint model exists. If not, use CleanerRating with low scores
    const customerIssues = await prisma.cleanerRating.count({
      where: {
        rating: {
          lt: 3, // Ratings below 3 indicate issues
        },
        Job: {
          branchId,
          completedAt: {
            gte: weekStart, // Issues from this week
          },
        },
      },
    });

    // Recent jobs (last 7 days) - for activity tracking
    const recentJobsCount = await prisma.job.count({
      where: {
        branchId,
        createdAt: {
          gte: weekStart,
        },
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        jobsToday,
        jobsThisWeek,
        activeCleaners,
        jobsNeedingAttention,
        customerIssues,
        recentJobsCount,
        // NO financial data - intentionally excluded
      },
      branch: {
        id: branchId,
        name: authResult.branchOwner?.primaryBranchId ? undefined : "Your Branch", // Don't expose branch name if not needed
      },
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_DASHBOARD] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dashboard metrics",
      },
      { status: 500 }
    );
  }
}

