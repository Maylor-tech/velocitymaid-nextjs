/**
 * GET /api/cleaner/jobs/[jobId]
 *
 * Get a specific job assigned to the authenticated cleaner.
 * When Job.propertyId is set, includes standing Property instructions.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { toCleanerPropertyView } from "@/lib/properties/propertyService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCleanerJobAssignment(req, params.jobId);

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        customerName: true,
        serviceType: true,
        serviceLocation: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        totalPrice: true,
        currency: true,
        assignedAt: true,
        assignedCleanerId: true,
        onTheWayAt: true,
        completedAt: true,
        internalNotes: true,
        propertyId: true,
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Property: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.assignedCleanerId !== auth.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "This job is not assigned to your cleaner account.",
        },
        { status: 403 }
      );
    }

    const { Property, internalNotes, propertyId, ...jobFields } = job;

    const formattedJob = {
      ...jobFields,
      propertyId,
      preferredDate: job.preferredDate?.toISOString() ?? null,
      assignedAt: job.assignedAt?.toISOString() ?? null,
      onTheWayAt: job.onTheWayAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      /** Occurrence-specific notes (admin). Distinct from Property standing instructions. */
      jobSpecificNotes: internalNotes,
      property: Property ? toCleanerPropertyView(Property) : null,
    };

    return NextResponse.json({
      success: true,
      job: formattedJob,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_JOB]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch job",
      },
      { status: 500 }
    );
  }
}
