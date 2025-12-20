import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

/**
 * GET /api/cleaner/jobs/[jobId]
 * 
 * Get a specific job assigned to the authenticated cleaner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireCleanerJobAssignment(req, jobId);
    const authResult = await getAuthenticatedCleaner(req);
    const cleanerId = authResult.cleanerId!;

    // 2. Find job and verify assignment
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        serviceLocation: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        totalPrice: true,
        currency: true,
        assignedAt: true,
        assignedCleanerId: true, // Include in select
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // 3. Verify job is assigned to this cleaner
    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json(
        { error: "Job is not assigned to you" },
        { status: 403 }
      );
    }

    // Format dates for JSON
    const formattedJob = {
      ...job,
      preferredDate: job.preferredDate?.toISOString() || null,
      assignedAt: job.assignedAt?.toISOString() || null,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
    };

    return NextResponse.json({
      success: true,
      job: formattedJob,
    });
  } catch (err: any) {
    console.error("[CLEANER_JOB] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch job" },
      { status: 500 }
    );
  }
}

