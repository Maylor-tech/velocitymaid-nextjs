/**
 * GET /api/branch-owner/cleaners
 * 
 * Returns list of cleaners assigned to branch owner's branch
 * Read-only view - NO financial data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";

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

    // Get cleaners assigned to this branch
    const cleaners = await prisma.user.findMany({
      where: {
        role: "CLEANER",
        isActive: true,
        UserBranch: {
          some: {
            branchId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        homeZip: true,
        preferredCities: true,
        // NO financial data
      },
      orderBy: {
        name: "asc",
      },
    });

    // Optimize: Get stats in bulk instead of per cleaner
    const cleanerIds = cleaners.map((c) => c.id);

    // Get all job counts in one query per cleaner
    // Note: Using raw query to handle enum type properly
    const jobCounts = await Promise.all(
      cleanerIds.map(async (cleanerId) => {
        const jobs = await prisma.job.findMany({
          where: {
            assignedCleanerId: cleanerId,
            branchId,
          },
          select: {
            status: true,
          },
        });
        
        // Group by status manually
        const grouped = jobs.reduce((acc, job) => {
          const status = job.status as string;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(grouped).map(([status, count]) => ({
          status,
          _count: { id: count },
        }));
      })
    );

    // Get all ratings in bulk
    const allRatings = await prisma.cleanerRating.findMany({
      where: {
        cleanerId: { in: cleanerIds },
        Job: {
          branchId,
        },
      },
      select: {
        cleanerId: true,
        rating: true,
      },
    });

    // Get all payment methods in bulk (using JamaicaPaymentMethod for now)
    // Note: Branch owners should only see if payment method exists, not details
    const allPaymentMethods = await prisma.jamaicaPaymentMethod.findMany({
      where: {
        cleanerId: { in: cleanerIds },
      },
      select: {
        cleanerId: true,
        id: true,
        // NO details - branch owners cannot see payment method details
      },
    });

    // Get all training statuses in bulk
    const allTrainingStatuses = await prisma.trainingStatus.findMany({
      where: {
        cleanerId: { in: cleanerIds },
      },
      select: {
        cleanerId: true,
        overallStatus: true,
      },
    });

    // Build cleaner stats
    const cleanerStats = cleaners.map((cleaner, index) => {
      const counts = jobCounts[index] || [];
      const totalJobs = counts.reduce((sum, c) => sum + (c._count?.id || 0), 0);
      const completedJobs =
        counts.find((c) => c.status === "COMPLETED")?._count?.id || 0;

      const ratings = allRatings.filter((r) => r.cleanerId === cleaner.id);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;

      const paymentMethod = allPaymentMethods.find(
        (pm) => pm.cleanerId === cleaner.id
      );
      const trainingStatus = allTrainingStatuses.find(
        (ts) => ts.cleanerId === cleaner.id
      );

      return {
        ...cleaner,
        stats: {
          totalJobs,
          completedJobs,
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          paymentMethodStatus: paymentMethod
            ? {
                exists: true,
                verified: true, // Assume verified if exists (branch owner can't see details)
                status: "verified",
              }
            : {
                exists: false,
                verified: false,
                status: "none",
              },
          trainingStatus: trainingStatus?.overallStatus || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      cleaners: cleanerStats,
      count: cleanerStats.length,
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_CLEANERS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch cleaners",
      },
      { status: 500 }
    );
  }
}

