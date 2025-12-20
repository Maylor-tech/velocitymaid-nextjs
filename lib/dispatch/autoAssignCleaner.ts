/**
 * Auto-Assign Cleaner Helper
 * 
 * Automatically assigns the best available cleaner to a job
 * - Finds eligible cleaners for the job's branch
 * - Excludes cleaners with overlapping bookings
 * - Assigns cleaner and creates necessary records
 * - Sends notification email
 */

import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { JobStatus, UserRole } from "@prisma/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AutoAssignResult {
  success: boolean;
  cleanerId?: string;
  cleanerName?: string;
  error?: string;
}

/**
 * Auto-assign a cleaner to a job
 * 
 * @param jobId - The job ID to assign a cleaner to
 * @returns AutoAssignResult
 */
export async function autoAssignCleaner(jobId: string): Promise<AutoAssignResult> {
  try {
    // 1. Get job with full details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
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
          },
        },
      },
    });

    if (!job) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    // 2. Verify job status allows assignment
    if (job.status !== JobStatus.CONFIRMED) {
      return {
        success: false,
        error: `Job status must be CONFIRMED, but is ${job.status}`,
      };
    }

    // 3. Find eligible cleaners for this branch (ACTIVE only)
    const eligibleCleaners = await prisma.user.findMany({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
        OR: [
          { primaryBranchId: job.branchId },
          {
            UserBranch: {
              some: {
                branchId: job.branchId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        primaryBranchId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (eligibleCleaners.length === 0) {
      await logAuditEntry({
        action: "AUTO_ASSIGN_NO_CLEANERS",
        entityType: "Job",
        entityId: jobId,
        description: `No active cleaners found for branch ${job.Branch?.name || job.branchId}`,
        changes: {
          branchId: job.branchId,
        },
      });

      return {
        success: false,
        error: "No active cleaners available for this branch",
      };
    }

    // 4. Exclude cleaners with overlapping bookings
    // Check AssignmentLog for overlapping time slots
    const availableCleaners: typeof eligibleCleaners = [];

    if (job.preferredDate) {
      const jobStartTime = new Date(job.preferredDate);
      // Default to 3 hours duration if not specified
      const estimatedHours = 3;
      const jobEndTime = new Date(jobStartTime.getTime() + estimatedHours * 60 * 60 * 1000);

      for (const cleaner of eligibleCleaners) {
        // Check if cleaner has overlapping assignments
        const overlappingAssignments = await prisma.assignmentLog.findMany({
          where: {
            cleanerId: cleaner.id,
            outcome: "ASSIGNED",
            Job: {
              status: {
                in: [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS],
              },
              preferredDate: {
                not: null,
              },
            },
          },
          include: {
            Job: {
              select: {
                preferredDate: true,
              },
            },
          },
        });

        // Check for time overlaps
        let hasOverlap = false;
        for (const assignment of overlappingAssignments) {
          if (assignment.Job.preferredDate) {
            const assignmentStart = new Date(assignment.Job.preferredDate);
            const assignmentEnd = new Date(assignmentStart.getTime() + estimatedHours * 60 * 60 * 1000);

            // Check if time ranges overlap
            if (
              (jobStartTime >= assignmentStart && jobStartTime < assignmentEnd) ||
              (jobEndTime > assignmentStart && jobEndTime <= assignmentEnd) ||
              (jobStartTime <= assignmentStart && jobEndTime >= assignmentEnd)
            ) {
              hasOverlap = true;
              break;
            }
          }
        }

        if (!hasOverlap) {
          availableCleaners.push(cleaner);
        }
      }
    } else {
      // If no preferred date, all eligible cleaners are available
      availableCleaners.push(...eligibleCleaners);
    }

    if (availableCleaners.length === 0) {
      await logAuditEntry({
        action: "AUTO_ASSIGN_NO_AVAILABLE",
        entityType: "Job",
        entityId: jobId,
        description: `No cleaners available (all have overlapping bookings)`,
        changes: {
          branchId: job.branchId,
          eligibleCount: eligibleCleaners.length,
        },
      });

      return {
        success: false,
        error: "No cleaners available (all have overlapping bookings)",
      };
    }

    // 5. Select first available cleaner (can be enhanced with scoring later)
    const selectedCleaner = availableCleaners[0];

    // 6. Create AssignmentLog
    const assignment = await prisma.assignmentLog.create({
      data: {
        jobId: jobId,
        cleanerId: selectedCleaner.id,
        branchId: job.branchId,
        outcome: "ASSIGNED",
        reason: `Auto-assigned to ${selectedCleaner.name}`,
        details: {
          assignedBy: "system",
          cleanerName: selectedCleaner.name,
          previousStatus: job.status,
          newStatus: "ASSIGNED",
          autoAssigned: true,
          ...(job.preferredDate && {
            booking: {
              startTime: new Date(job.preferredDate).toISOString(),
              endTime: new Date(
                new Date(job.preferredDate).getTime() + 3 * 60 * 60 * 1000
              ).toISOString(),
              status: "BOOKED",
            },
          }),
        },
      },
    });

    // 7. Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: selectedCleaner.id,
        status: JobStatus.ASSIGNED,
        assignedAt: new Date(),
      },
    });

    // 8. Send notification email to cleaner (non-blocking)
    if (selectedCleaner.email && process.env.RESEND_API_KEY) {
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
          to: selectedCleaner.email,
          subject: "🧹 New Job Assigned (Auto)",
          html: `
            <h2>You've been auto-assigned a new job</h2>
            <p><strong>Customer:</strong> ${job.customerName || "N/A"}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${job.preferredTime || "TBD"}</p>
            <p><strong>Address:</strong> ${job.address || "Address TBD"}</p>
            <p><strong>Service:</strong> ${job.serviceType || "Standard Cleaning"}</p>
            <p>Please accept or decline in your dashboard.</p>
            <p>Thank you,<br>VelocityMaid Operations</p>
          `,
        })
        .catch((err) => {
          console.error("[AUTO_ASSIGN] Failed to send cleaner email:", err);
        });
    }

    // 9. Log audit entry
    await logAuditEntry({
      action: "JOB_AUTO_ASSIGNED",
      entityType: "Job",
      entityId: jobId,
      description: `Job auto-assigned to cleaner ${selectedCleaner.name} (${selectedCleaner.id})`,
      changes: {
        cleanerId: selectedCleaner.id,
        cleanerName: selectedCleaner.name,
        previousStatus: job.status,
        newStatus: JobStatus.ASSIGNED,
        assignmentLogId: assignment.id,
        autoAssigned: true,
      },
    });

    console.log(`[AUTO_ASSIGN] Job ${jobId} assigned to cleaner ${selectedCleaner.id}`);

    return {
      success: true,
      cleanerId: selectedCleaner.id,
      cleanerName: selectedCleaner.name || undefined,
    };
  } catch (err: any) {
    console.error("[AUTO_ASSIGN] Error:", err);
    return {
      success: false,
      error: err?.message || "Failed to auto-assign cleaner",
    };
  }
}







