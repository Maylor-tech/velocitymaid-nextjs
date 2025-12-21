import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { JobStatus } from "@prisma/client";
import { Resend } from "resend";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

// Initialize Resend (lazy initialization to prevent build-time errors)
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * PATCH /api/cleaner/jobs/[jobId]/start
 * 
 * Cleaner starts a job (marks as IN_PROGRESS)
 * - Validates cleaner identity
 * - Confirms job is assigned to this cleaner
 * - Enforces strict status guard: must be ON_THE_WAY
 * - Sets status to IN_PROGRESS
 * - Persists timestamp
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

    // 1. Authenticate cleaner
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

    // 4. Enforce strict status guard: must be ON_THE_WAY
    if (job.status !== JobStatus.ON_THE_WAY) {
      return NextResponse.json(
        { 
          error: `Job cannot be started. Current status: ${job.status}. Must be ON_THE_WAY.`,
          currentStatus: job.status,
          requiredStatus: "ON_THE_WAY",
        },
        { status: 400 }
      );
    }

    // Phase M: Record check-in timestamp
    const checkInTimestamp = new Date();

    // 5. Update job status to IN_PROGRESS
    // Note: onTheWayAt was already set in accept, we just update status
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        startedAt: checkInTimestamp,
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
      action: "JOB_STARTED",
      entityType: "Job",
      entityId: jobId,
      description: `Cleaner ${authResult.cleaner?.name || cleanerId} started job`,
      changes: {
        previousStatus: job.status,
        newStatus: JobStatus.IN_PROGRESS,
        cleanerId: cleanerId,
      },
    });

    // 7. Send customer notification email (non-blocking)
    const resend = getResend();
    if (job.Customer?.email && resend) {
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
          subject: "Service has started! 🧹",
          html: `
            <h2>Service in progress</h2>
            <p>Your cleaner has arrived and started the service.</p>
            <p><strong>Service Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${job.preferredTime || "TBD"}</p>
            <p><strong>Address:</strong> ${job.address || "As provided"}</p>
            <p>You'll receive a notification when the service is complete.</p>
            <p>Thank you for choosing VelocityMaid!</p>
          `,
        })
        .catch((err) => {
          console.error("[START] Failed to send customer email:", err);
        });
    }

    console.log(`[CLEANER] Job ${jobId} started by cleaner ${cleanerId}`);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Job started successfully",
    });
  } catch (err: any) {
    console.error("[CLEANER_START] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to start job" },
      { status: 500 }
    );
  }
}

