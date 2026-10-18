import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { computeCleanDurationMins } from "@/lib/dispatch/duration";
import { assertTransition } from "@/lib/jobStatus";
import {
  createAdminNotification,
  adminNotificationHelpers,
} from "@/lib/notifications/adminNotificationCenter";

export interface SubmittedQcJob {
  id: string;
  status: JobStatus;
  paymentStatus: string;
  billingPolicy: string | null;
  completedAt: Date | null;
  submittedForQcAt: Date | null;
  startedAt: Date | null;
  cleanDurationMins: number | null;
}

/**
 * Cleaner Finish / admin override → AWAITING_QC.
 * Does not set COMPLETED, completedAt, or paymentStatus, and does not email.
 */
export async function submitJobForQc(input: {
  jobId: string;
  actorId: string;
  actorRole: "CLEANER" | "ADMIN";
}): Promise<
  | { kind: "missing" }
  | { kind: "not-in-progress"; status: JobStatus }
  | { kind: "already"; job: SubmittedQcJob; message: string }
  | { kind: "submitted"; job: SubmittedQcJob }
  | { kind: "payment-changed" }
  | { kind: "completed-forbidden" }
> {
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      billingPolicy: true,
      assignedCleanerId: true,
      startedAt: true,
      completedAt: true,
      submittedForQcAt: true,
      cleanDurationMins: true,
      jobReference: true,
    },
  });

  if (!job) return { kind: "missing" };

  if (job.status === JobStatus.COMPLETED) {
    return {
      kind: "already",
      message: "Admin already approved completion.",
      job: {
        id: job.id,
        status: job.status,
        paymentStatus: job.paymentStatus,
        billingPolicy: job.billingPolicy,
        completedAt: job.completedAt,
        submittedForQcAt: job.submittedForQcAt,
        startedAt: job.startedAt,
        cleanDurationMins: job.cleanDurationMins,
      },
    };
  }

  if (job.status === JobStatus.AWAITING_QC) {
    return {
      kind: "already",
      message: "Already submitted for QC. Admin still reviews completion and billing.",
      job: {
        id: job.id,
        status: job.status,
        paymentStatus: job.paymentStatus,
        billingPolicy: job.billingPolicy,
        completedAt: job.completedAt,
        submittedForQcAt: job.submittedForQcAt,
        startedAt: job.startedAt,
        cleanDurationMins: job.cleanDurationMins,
      },
    };
  }

  if (job.status !== JobStatus.IN_PROGRESS) {
    return { kind: "not-in-progress", status: job.status };
  }

  assertTransition(job.status, JobStatus.AWAITING_QC);

  const submittedForQcAt = new Date();
  const cleanDurationMins = computeCleanDurationMins({
    startedAt: job.startedAt,
    completedAt: submittedForQcAt,
    existingMins: job.cleanDurationMins,
  });

  const updatedJob = await prisma.job.update({
    where: { id: input.jobId },
    data: {
      status: JobStatus.AWAITING_QC,
      submittedForQcAt,
      ...(cleanDurationMins != null ? { cleanDurationMins } : {}),
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      billingPolicy: true,
      completedAt: true,
      submittedForQcAt: true,
      startedAt: true,
      cleanDurationMins: true,
    },
  });

  if (updatedJob.paymentStatus !== job.paymentStatus) {
    return { kind: "payment-changed" };
  }

  if (updatedJob.status === JobStatus.COMPLETED || updatedJob.completedAt != null) {
    return { kind: "completed-forbidden" };
  }

  await logAuditEntry({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "JOB_SUBMITTED_FOR_QC",
    entityType: "Job",
    entityId: input.jobId,
    description:
      input.actorRole === "ADMIN"
        ? "Admin override submitted job for QC (photo slots waived; not invoiced, not COMPLETED)"
        : "Cleaner submitted job for QC (not invoiced, not COMPLETED)",
    changes: {
      previousStatus: job.status,
      newStatus: JobStatus.AWAITING_QC,
      submittedForQcAt: updatedJob.submittedForQcAt?.toISOString(),
      completedAt: updatedJob.completedAt?.toISOString() ?? null,
      startedAt: updatedJob.startedAt?.toISOString() ?? null,
      cleanDurationMins: updatedJob.cleanDurationMins,
      paymentStatusUnchanged: updatedJob.paymentStatus,
      billingPolicy: updatedJob.billingPolicy,
      adminOverride: input.actorRole === "ADMIN",
    },
  });

  createAdminNotification({
    type: "JOB_COMPLETED",
    severity: "INFO",
    message: `${job.jobReference || input.jobId} submitted for QC — review before invoicing`,
    jobId: input.jobId,
    actionUrl: adminNotificationHelpers.adminJobLink(input.jobId),
  }).catch(() => {});

  return { kind: "submitted", job: updatedJob };
}
