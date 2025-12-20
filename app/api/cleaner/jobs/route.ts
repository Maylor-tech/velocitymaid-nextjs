import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { JobStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

/**
 * GET /api/cleaner/jobs
 * 
 * Get all jobs assigned to the authenticated cleaner
 * Filters by status if provided
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "CLEANER");
    const authResult = await getAuthenticatedCleaner(req);
    const cleanerId = authResult.cleanerId!;

    // 2. Get status filter from query params
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // 3. Find jobs assigned to this cleaner
    const jobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        ...(statusFilter ? { status: statusFilter as JobStatus } : {}),
      },
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        totalPrice: true,
        currency: true,
        assignedAt: true,
        createdAt: true,
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Format dates for JSON
    const formattedJobs = jobs.map((job) => ({
      ...job,
      preferredDate: job.preferredDate?.toISOString() || null,
      assignedAt: job.assignedAt?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      count: formattedJobs.length,
    });
  } catch (err: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (err instanceof Response) {
      throw err;
    }

    console.error("[CLEANER_JOBS] Error:", err);
    
    // Return consistent error format
    const status = err?.status || 500;
    return NextResponse.json(
      { 
        success: false,
        error: err?.message || "Failed to fetch jobs" 
      },
      { status }
    );
  }
}

