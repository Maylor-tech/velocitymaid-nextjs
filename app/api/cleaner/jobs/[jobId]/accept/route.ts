import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { JobStatus } from "@prisma/client";
import { Resend } from "resend";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * PATCH /api/cleaner/jobs/[jobId]/accept
 * 
 * Cleaner accepts an assigned job
 * - Validates cleaner identity
 * - Confirms job is assigned to this cleaner
 * - Sets status to IN_PROGRESS
 * - Logs audit entry
 * - Sends customer notification email
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireCleanerJobAssignment(req, jobId);
    const authResult = await getAuthenticatedCleaner(req);
    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated as cleaner" },
        { status: 401 }
      );
    }

    const cleanerId = authResult.cleanerId;

    // 2. Find job and verify assignment
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        Customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        Branch: {
          select: {
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

    // 4. Verify job status allows acceptance (strict guard)
    if (job.status !== JobStatus.ASSIGNED) {
      return NextResponse.json(
        { 
          error: `Job cannot be accepted. Current status: ${job.status}. Must be ASSIGNED.`,
          currentStatus: job.status,
          requiredStatus: "ASSIGNED",
        },
        { status: 400 }
      );
    }

    // 5. Update job status to ON_THE_WAY and set timestamp
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.ON_THE_WAY,
        onTheWayAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        customerName: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        onTheWayAt: true,
      },
    });

    // 6. Log audit entry
    await logAuditEntry({
      actorId: cleanerId,
      actorRole: "CLEANER",
      action: "JOB_ACCEPTED",
      entityType: "Job",
      entityId: jobId,
      description: `Cleaner ${authResult.cleaner?.name || cleanerId} accepted job - on the way`,
      changes: {
        previousStatus: job.status,
        newStatus: JobStatus.ON_THE_WAY,
        cleanerId: cleanerId,
        onTheWayAt: updatedJob.onTheWayAt?.toISOString(),
      },
    });

    // 7. Send customer notification email (non-blocking)
    if (job.Customer?.email && process.env.RESEND_API_KEY) {
      const formattedDate = job.preferredDate
        ? new Date(job.preferredDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBD";

      resend.emails
        .send({
          from: "VelocityMaid <onboarding@resend.dev>",
          to: job.Customer.email,
          subject: "Your cleaner has accepted and is on the way! 🧹",
          html: `
            <h2>Great news!</h2>
            <p>Your cleaner has accepted the job and is on the way.</p>
            <p><strong>Service Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${job.preferredTime || "TBD"}</p>
            <p><strong>Address:</strong> ${job.address || "As provided"}</p>
            <p>You'll receive updates as the service progresses.</p>
            <p>Thank you for choosing VelocityMaid!</p>
          `,
        })
        .catch((err) => {
          console.error("[ACCEPT] Failed to send customer email:", err);
        });
    }

    console.log(`[CLEANER] Job ${jobId} accepted by cleaner ${cleanerId}`);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Job accepted successfully",
    });
  } catch (err: any) {
    console.error("[CLEANER_ACCEPT] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to accept job" },
      { status: 500 }
    );
  }
}

