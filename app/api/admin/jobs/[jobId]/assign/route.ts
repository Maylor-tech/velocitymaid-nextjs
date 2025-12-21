import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { JobStatus } from "@prisma/client";
import { Resend } from "resend";
import { requireRole } from "@/lib/auth/requireRole";
import { shouldLockPricing, lockJobPricing, createPricingSnapshot, isPriceLocked } from "@/lib/pricing/lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/jobs/[jobId]/assign
 * 
 * Assign a cleaner to a job
 * Only allowed if job.status is CONFIRMED
 * Sets status to ASSIGNED
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    const jobId = params.jobId;
    const body = await req.json();
    const { cleanerId } = body;

    if (!cleanerId) {
      return NextResponse.json(
        { error: "Missing required field: cleanerId" },
        { status: 400 }
      );
    }

    // Find job with full details for email and availability (include pricing for auto-lock)
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        assignedCleanerId: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        branchId: true,
        createdAt: true, // Phase M: For SLA tracking
        // Phase L: Pricing fields for auto-lock
        priceLockedAt: true,
        totalPrice: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        currency: true,
        pricingReferenceId: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Guardrails: Only allow assignment for CONFIRMED or ASSIGNED (reassignment) statuses
    // Prevent assignment for IN_PROGRESS, COMPLETED, CANCELLED
    if (![JobStatus.CONFIRMED, JobStatus.ASSIGNED].includes(job.status)) {
      return NextResponse.json(
        { 
          error: `Cannot assign cleaner. Job status must be CONFIRMED or ASSIGNED, but is ${job.status}`,
          allowedStatuses: [JobStatus.CONFIRMED, JobStatus.ASSIGNED],
        },
        { status: 400 }
      );
    }

    // Verify cleaner exists and get email
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!cleaner) {
      return NextResponse.json(
        { error: "Cleaner not found" },
        { status: 404 }
      );
    }

    // Phase M: Check cleaner assignment eligibility (payment method required)
    const { checkCleanerAssignmentEligibility } = await import("@/lib/pilot/cleanerValidation");
    const eligibility = await checkCleanerAssignmentEligibility(cleanerId);

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reason || "Cleaner is not eligible for assignment",
          eligibility: {
            paymentMethod: eligibility.paymentMethod,
            blockers: eligibility.blockers,
          },
        },
        { status: 400 }
      );
    }

    // Get branch name for email
    const branch = await prisma.branch.findUnique({
      where: { id: job.branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Job branch not found" },
        { status: 404 }
      );
    }

    // 1. Create AssignmentLog entry
    const assignment = await prisma.assignmentLog.create({
      data: {
        jobId: jobId,
        cleanerId: cleanerId,
        branchId: job.branchId,
        outcome: "ASSIGNED",
        reason: `Manually assigned to ${cleaner.name}`,
        details: {
          assignedBy: "admin",
          cleanerName: cleaner.name,
          previousStatus: job.status,
          newStatus: "ASSIGNED",
        },
      },
    });

    // 2. Create cleaner availability booking
    // Note: This assumes a model exists with these fields. If not, store in AssignmentLog details.
    // For now, we'll store booking info in AssignmentLog details to prevent overlaps
    // TODO: Create CleanerBooking model with cleanerId, jobId, startTime, endTime, status
    if (job.preferredDate) {
      // Calculate end time (default 3 hours if no duration specified)
      const estimatedHours = 3; // Default, can be calculated from serviceType
      const startTime = new Date(job.preferredDate);
      const endTime = new Date(startTime.getTime() + estimatedHours * 60 * 60 * 1000);

      // Store booking info in AssignmentLog details for conflict checking
      await prisma.assignmentLog.update({
        where: { id: assignment.id },
        data: {
          details: {
            ...assignment.details,
            booking: {
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              status: "BOOKED",
            },
          },
        },
      });
    }

    // Phase L: Auto-lock pricing when status changes to ASSIGNED
    if (!isPriceLocked(job as any)) {
      try {
        const snapshot = createPricingSnapshot(job as any, auth.userId);
        await lockJobPricing(jobId, auth.userId, snapshot);
        console.log(`[PHASE_L] Auto-locked pricing for job ${jobId} on assignment`);
      } catch (lockError: any) {
        console.error(`[PHASE_L] Failed to auto-lock pricing for job ${jobId}:`, lockError);
        // Don't block assignment if lock fails - log and continue
      }
    }

    // Phase M: Track assignment time for SLA
    const assignedAt = new Date();

    // 3. Update job: assign cleaner and set status to ASSIGNED
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: cleanerId, // Note: Job model uses assignedCleanerId, not cleanerId
        status: JobStatus.ASSIGNED,
        assignedAt,
      },
      select: {
        id: true,
        status: true,
        assignedCleanerId: true,
        assignedAt: true,
        customerName: true,
        serviceType: true,
        createdAt: true, // Phase M: For SLA tracking
      },
    });

    // Phase M: Log assignment time for SLA tracking
    const jobCreatedAt = job.createdAt || new Date();
    const actualAssignmentTime = Math.round(
      (assignedAt.getTime() - jobCreatedAt.getTime()) / (1000 * 60)
    );
    console.log(
      `[PHASE_M_SLA] Job ${jobId} assigned in ${actualAssignmentTime} minutes (SLA: 60 minutes)`
    );

    // 4. Send email notification to cleaner (non-blocking)
    if (cleaner.email && process.env.RESEND_API_KEY) {
      const formattedDate = job.preferredDate
        ? new Date(job.preferredDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBD";

      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails
        .send({
          from: "VelocityMaid <onboarding@resend.dev>", // Using verified domain
          to: cleaner.email,
          subject: "🧹 New Job Assigned",
          html: `
            <h2>You've been assigned a new job</h2>
            <p><strong>Customer:</strong> ${job.customerName || "N/A"}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${job.preferredTime || "TBD"}</p>
            <p><strong>Address:</strong> ${job.address || "Address TBD"}</p>
            <p><strong>Service:</strong> ${job.serviceType || "Standard Cleaning"}</p>
            <p>Please confirm in your dashboard.</p>
            <p>Thank you,<br>VelocityMaid Operations</p>
          `,
        })
        .catch((err) => {
          console.error("[ASSIGNMENT] Failed to send cleaner email:", err);
        });
    }

    // 5. Log audit entry for assignment (non-blocking)
    logAuditEntry({
      action: "JOB_ASSIGNED",
      entityType: "Job",
      entityId: jobId,
      description: `Job assigned to cleaner ${cleaner.name} (${cleanerId})`,
      changes: {
        cleanerId: cleanerId,
        cleanerName: cleaner.name,
        previousStatus: job.status,
        newStatus: JobStatus.ASSIGNED,
        assignmentLogId: assignment.id,
      },
    }).catch((err) => {
      console.error("[AUDIT] Failed to log assignment:", err);
    });

    // 6. Log audit entry for cleaner notification (non-blocking)
    logAuditEntry({
      action: "CLEANER_NOTIFIED",
      entityType: "Job",
      entityId: jobId,
      description: `Cleaner ${cleaner.name} notified of assignment`,
      changes: {
        cleanerId: cleanerId,
        cleanerEmail: cleaner.email,
        notificationMethod: "email",
      },
    }).catch((err) => {
      console.error("[AUDIT] Failed to log cleaner notification:", err);
    });

    console.log(`[ADMIN] Job ${jobId} assigned to cleaner ${cleanerId}`);

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (err: any) {
    console.error("[ADMIN] Assignment error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to assign cleaner" },
      { status: 500 }
    );
  }
}

