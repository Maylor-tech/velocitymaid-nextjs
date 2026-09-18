/**
 * Feedback & Quality Loop V1 — ServiceFeedback domain.
 * Private CSAT only. Never mutates JobPayout / Invoice / compensation.
 */

import {
  JobStatus,
  ServiceFeedbackDisposition,
  ServiceFeedbackStatus,
  type Prisma,
  type ServiceFeedback,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

export const FEEDBACK_AUDIT = {
  REQUESTED: 'FEEDBACK_REQUESTED',
  SUBMITTED: 'FEEDBACK_SUBMITTED',
  REVIEWED: 'FEEDBACK_REVIEWED',
  RELEASED: 'FEEDBACK_RELEASED',
  RESOLVED: 'FEEDBACK_RESOLVED',
  REMINDER_SENT: 'FEEDBACK_REMINDER_SENT',
} as const;

export const DISPOSITION_CATEGORIES: ServiceFeedbackDisposition[] = [
  'SERVICE_QUALITY',
  'CLEANER_PERFORMANCE',
  'ACCESS',
  'PROPERTY_CONDITION',
  'SUPPLIES_LINENS',
  'MAINTENANCE',
  'SCHEDULING_TIMING',
  'CUSTOMER_EXPECTATION',
  'OTHER',
];

const LOW_OVERALL_MAX = 3;

export function feedbackReminderHours(): number {
  const raw = Number(process.env.FEEDBACK_REMINDER_HOURS ?? '48');
  return Number.isFinite(raw) && raw > 0 ? raw : 48;
}

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://www.velocitymaid.com'
  );
}

export function feedbackPublicUrl(publicToken: string): string {
  return `${appBaseUrl()}/feedback/${publicToken}`;
}

export function isValidStarRating(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export type FeedbackSubmitInput = {
  overallRating: number;
  cleanlinessRating: number;
  communicationRating: number;
  timelinessRating: number;
  comment?: string | null;
};

export function validateFeedbackSubmit(
  input: FeedbackSubmitInput
): string | null {
  if (!isValidStarRating(input.overallRating)) {
    return 'Overall rating must be an integer from 1 to 5';
  }
  if (!isValidStarRating(input.cleanlinessRating)) {
    return 'Cleanliness rating must be an integer from 1 to 5';
  }
  if (!isValidStarRating(input.communicationRating)) {
    return 'Communication rating must be an integer from 1 to 5';
  }
  if (!isValidStarRating(input.timelinessRating)) {
    return 'Timeliness rating must be an integer from 1 to 5';
  }
  if (input.comment != null && typeof input.comment !== 'string') {
    return 'Comment must be text';
  }
  if (typeof input.comment === 'string' && input.comment.length > 4000) {
    return 'Comment is too long';
  }
  return null;
}

function statusAfterSubmit(overallRating: number): ServiceFeedbackStatus {
  return overallRating <= LOW_OVERALL_MAX
    ? ServiceFeedbackStatus.UNDER_REVIEW
    : ServiceFeedbackStatus.SUBMITTED;
}

export async function requestServiceFeedbackForJob(
  jobId: string,
  actorId?: string | null
): Promise<{
  feedback: ServiceFeedback;
  created: boolean;
  alreadyExists: boolean;
  feedbackUrl: string;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      customerId: true,
      assignedCleanerId: true,
      propertyId: true,
      Customer: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!job) throw new Error('Job not found');
  if (job.status !== JobStatus.COMPLETED) {
    throw new Error('Feedback can only be requested after the job is COMPLETED');
  }
  if (!job.customerId || !job.Customer) {
    throw new Error('Job has no customer on file');
  }
  if (!job.Customer.email) {
    throw new Error('Customer has no email on file');
  }

  const existing = await prisma.serviceFeedback.findUnique({
    where: { jobId },
  });
  if (existing) {
    return {
      feedback: existing,
      created: false,
      alreadyExists: true,
      feedbackUrl: feedbackPublicUrl(existing.publicToken),
    };
  }

  const feedback = await prisma.serviceFeedback.create({
    data: {
      jobId,
      customerId: job.customerId,
      cleanerId: job.assignedCleanerId,
      propertyId: job.propertyId,
      status: ServiceFeedbackStatus.REQUESTED,
      requestedAt: new Date(),
    },
  });

  await logAuditEntry({
    actorId: actorId ?? null,
    actorRole: 'ADMIN',
    action: FEEDBACK_AUDIT.REQUESTED,
    entityType: 'ServiceFeedback',
    entityId: feedback.id,
    description: `Private feedback requested for job ${jobId}`,
    changes: { jobId, publicToken: feedback.publicToken },
  });

  return {
    feedback,
    created: true,
    alreadyExists: false,
    feedbackUrl: feedbackPublicUrl(feedback.publicToken),
  };
}

export type PublicFeedbackView =
  | {
      state: 'ready';
      token: string;
      propertyLabel: string | null;
      serviceDate: string | null;
    }
  | {
      state: 'already_submitted';
      token: string;
      submittedAt: string | null;
    }
  | { state: 'invalid' };

export async function getPublicFeedbackByToken(
  token: string
): Promise<PublicFeedbackView> {
  if (!token?.trim()) return { state: 'invalid' };

  const row = await prisma.serviceFeedback.findUnique({
    where: { publicToken: token.trim() },
    include: {
      Job: {
        select: {
          preferredDate: true,
          address: true,
          Property: { select: { name: true, address: true } },
        },
      },
    },
  });

  if (!row) return { state: 'invalid' };

  if (row.submittedAt != null || row.status !== ServiceFeedbackStatus.REQUESTED) {
    return {
      state: 'already_submitted',
      token: row.publicToken,
      submittedAt: row.submittedAt?.toISOString() ?? null,
    };
  }

  const propertyLabel =
    row.Job.Property?.name ||
    row.Job.Property?.address ||
    row.Job.address ||
    null;

  return {
    state: 'ready',
    token: row.publicToken,
    propertyLabel,
    serviceDate: row.Job.preferredDate?.toISOString() ?? null,
  };
}

export async function submitPublicFeedback(
  token: string,
  input: FeedbackSubmitInput
): Promise<
  | { ok: true; status: ServiceFeedbackStatus; alreadySubmitted: boolean }
  | { ok: false; error: string; code: string }
> {
  const validationError = validateFeedbackSubmit(input);
  if (validationError) {
    return { ok: false, error: validationError, code: 'VALIDATION' };
  }

  const row = await prisma.serviceFeedback.findUnique({
    where: { publicToken: token.trim() },
  });
  if (!row) {
    return { ok: false, error: 'Feedback link is invalid', code: 'INVALID_TOKEN' };
  }

  if (row.submittedAt != null || row.status !== ServiceFeedbackStatus.REQUESTED) {
    return {
      ok: true,
      status: row.status,
      alreadySubmitted: true,
    };
  }

  const nextStatus = statusAfterSubmit(input.overallRating);
  const now = new Date();
  const comment =
    typeof input.comment === 'string' ? input.comment.trim() || null : null;

  // Atomic: only update if still REQUESTED / not submitted
  const updated = await prisma.serviceFeedback.updateMany({
    where: {
      id: row.id,
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
    },
    data: {
      overallRating: input.overallRating,
      cleanlinessRating: input.cleanlinessRating,
      communicationRating: input.communicationRating,
      timelinessRating: input.timelinessRating,
      comment,
      status: nextStatus,
      submittedAt: now,
      reviewedAt: nextStatus === ServiceFeedbackStatus.UNDER_REVIEW ? null : undefined,
    },
  });

  if (updated.count === 0) {
    const again = await prisma.serviceFeedback.findUnique({ where: { id: row.id } });
    return {
      ok: true,
      status: again?.status ?? row.status,
      alreadySubmitted: true,
    };
  }

  await logAuditEntry({
    actorRole: 'CUSTOMER',
    action: FEEDBACK_AUDIT.SUBMITTED,
    entityType: 'ServiceFeedback',
    entityId: row.id,
    description: `Customer submitted private service feedback`,
    changes: {
      overallRating: input.overallRating,
      status: nextStatus,
      lowRating: input.overallRating <= LOW_OVERALL_MAX,
    },
  });

  return { ok: true, status: nextStatus, alreadySubmitted: false };
}

export async function listServiceFeedbackForAdmin(options?: {
  status?: ServiceFeedbackStatus;
  lowOnly?: boolean;
  take?: number;
  /** When set, only feedback whose Job.branchId matches (branch-scoped admins). */
  authBranchId?: string;
}) {
  const where: Prisma.ServiceFeedbackWhereInput = {};
  if (options?.status) where.status = options.status;
  if (options?.lowOnly) {
    where.overallRating = { lte: LOW_OVERALL_MAX, not: null };
  }
  if (options?.authBranchId) {
    where.Job = { is: { branchId: options.authBranchId } };
  }

  return prisma.serviceFeedback.findMany({
    where,
    orderBy: [{ submittedAt: 'desc' }, { requestedAt: 'desc' }],
    take: options?.take ?? 100,
    include: {
      Customer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      Cleaner: { select: { id: true, name: true, email: true } },
      Property: { select: { id: true, name: true, address: true } },
      Job: {
        select: {
          id: true,
          jobReference: true,
          preferredDate: true,
          address: true,
          status: true,
          branchId: true,
        },
      },
    },
  });
}

/**
 * Load admin detail. Branch-scoped admins only see feedback for their Job.branchId.
 * Returns null for missing or cross-branch (same as other admin job APIs — no leak).
 */
export async function getServiceFeedbackAdminDetail(
  id: string,
  authBranchId?: string
) {
  return prisma.serviceFeedback.findFirst({
    where: {
      id,
      ...(authBranchId
        ? { Job: { is: { branchId: authBranchId } } }
        : {}),
    },
    include: {
      Customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      Cleaner: { select: { id: true, name: true, email: true, phone: true } },
      Property: {
        select: { id: true, name: true, address: true, city: true, state: true },
      },
      Job: {
        select: {
          id: true,
          jobReference: true,
          preferredDate: true,
          preferredTime: true,
          address: true,
          status: true,
          branchId: true,
          internalNotes: true,
          assignedCleanerId: true,
          completedAt: true,
          submittedForQcAt: true,
          CompletionReport: true,
          photos: {
            where: { category: { in: ['ISSUE', 'DAMAGE'] } },
            orderBy: { uploadedAt: 'asc' },
            take: 20,
          },
          JobChecklistItem: {
            where: { completed: true },
            select: { checklistItemId: true, completedAt: true },
            take: 60,
          },
          ComplianceIssue: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              type: true,
              status: true,
              severity: true,
              reason: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function adminUpdateServiceFeedback(
  id: string,
  input: {
    dispositionCategory?: ServiceFeedbackDisposition | null;
    adminNotes?: string | null;
    action?: 'review' | 'release' | 'resolve';
  },
  actorId: string,
  authBranchId?: string
) {
  const existing = await prisma.serviceFeedback.findFirst({
    where: {
      id,
      ...(authBranchId
        ? { Job: { is: { branchId: authBranchId } } }
        : {}),
    },
  });
  if (!existing) throw new Error('Feedback not found');

  const data: Prisma.ServiceFeedbackUpdateInput = {};
  const now = new Date();

  if (input.dispositionCategory !== undefined) {
    data.dispositionCategory = input.dispositionCategory;
  }
  if (input.adminNotes !== undefined) {
    data.adminNotes = input.adminNotes?.trim() || null;
  }

  let auditAction: string | null = null;

  if (input.action === 'review') {
    data.status = ServiceFeedbackStatus.UNDER_REVIEW;
    data.reviewedAt = now;
    auditAction = FEEDBACK_AUDIT.REVIEWED;
  } else if (input.action === 'release') {
    if (!existing.submittedAt) {
      throw new Error('Cannot release feedback that has not been submitted');
    }
    data.status = ServiceFeedbackStatus.RELEASED;
    data.releasedAt = now;
    if (!existing.reviewedAt) data.reviewedAt = now;
    auditAction = FEEDBACK_AUDIT.RELEASED;
  } else if (input.action === 'resolve') {
    data.status = ServiceFeedbackStatus.RESOLVED;
    data.resolvedAt = now;
    if (!existing.reviewedAt) data.reviewedAt = now;
    auditAction = FEEDBACK_AUDIT.RESOLVED;
  } else if (
    existing.status === ServiceFeedbackStatus.SUBMITTED ||
    existing.status === ServiceFeedbackStatus.UNDER_REVIEW
  ) {
    if (existing.submittedAt && !existing.reviewedAt) {
      data.reviewedAt = now;
      if (existing.status === ServiceFeedbackStatus.SUBMITTED) {
        data.status = ServiceFeedbackStatus.UNDER_REVIEW;
      }
      auditAction = FEEDBACK_AUDIT.REVIEWED;
    }
  }

  const updated = await prisma.serviceFeedback.update({
    where: { id },
    data,
  });

  if (auditAction) {
    await logAuditEntry({
      actorId,
      actorRole: 'ADMIN',
      action: auditAction,
      entityType: 'ServiceFeedback',
      entityId: id,
      description: `Admin ${input.action ?? 'updated'} service feedback`,
      changes: {
        dispositionCategory: updated.dispositionCategory,
        status: updated.status,
      },
    });
  }

  return updated;
}

/**
 * Option A: cron claims reminderSentAt before send (exactly-once, no double-send race).
 * Admin may manually re-email a still-open REQUESTED feedback without clearing
 * reminderSentAt — ops retry after failed Resend.
 */
export async function adminResendServiceFeedbackRequest(
  id: string,
  actorId: string,
  authBranchId?: string
) {
  const row = await prisma.serviceFeedback.findFirst({
    where: {
      id,
      ...(authBranchId
        ? { Job: { is: { branchId: authBranchId } } }
        : {}),
    },
    include: {
      Customer: { select: { email: true, firstName: true, lastName: true } },
      Job: {
        select: {
          address: true,
          Property: { select: { name: true, address: true } },
        },
      },
    },
  });
  if (!row) throw new Error('Feedback not found');
  if (row.submittedAt || row.status !== ServiceFeedbackStatus.REQUESTED) {
    throw new Error('Feedback already submitted — cannot resend request');
  }
  if (!row.Customer?.email) {
    throw new Error('Customer has no email on file');
  }

  const { sendServiceFeedbackRequestEmail } = await import(
    '@/lib/feedback/sendServiceFeedbackEmail'
  );
  const email = await sendServiceFeedbackRequestEmail({
    toEmail: row.Customer.email,
    clientName:
      `${row.Customer.firstName} ${row.Customer.lastName}`.trim() || 'there',
    propertyLabel:
      row.Job.Property?.name || row.Job.Property?.address || row.Job.address,
    publicToken: row.publicToken,
    isReminder: true,
  });

  await logAuditEntry({
    actorId,
    actorRole: 'ADMIN',
    action: FEEDBACK_AUDIT.REMINDER_SENT,
    entityType: 'ServiceFeedback',
    entityId: id,
    description: 'Admin manual private-feedback resend',
    changes: { emailSent: email.sent, skippedReason: email.skippedReason },
  });

  return { feedback: row, email };
}

export async function listReleasedFeedbackForCleaner(cleanerId: string) {
  return prisma.serviceFeedback.findMany({
    where: {
      cleanerId,
      status: {
        in: [ServiceFeedbackStatus.RELEASED, ServiceFeedbackStatus.RESOLVED],
      },
      releasedAt: { not: null },
      submittedAt: { not: null },
    },
    orderBy: { releasedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      jobId: true,
      overallRating: true,
      cleanlinessRating: true,
      communicationRating: true,
      timelinessRating: true,
      comment: true,
      status: true,
      releasedAt: true,
      submittedAt: true,
      cleanerResponse: true,
      cleanerRespondedAt: true,
      Job: {
        select: {
          jobReference: true,
          preferredDate: true,
          address: true,
          Property: { select: { name: true } },
        },
      },
    },
  });
}

export async function getReleasedFeedbackForCleaner(
  feedbackId: string,
  cleanerId: string
) {
  const row = await prisma.serviceFeedback.findFirst({
    where: {
      id: feedbackId,
      cleanerId,
      status: {
        in: [ServiceFeedbackStatus.RELEASED, ServiceFeedbackStatus.RESOLVED],
      },
      releasedAt: { not: null },
    },
    include: {
      Job: {
        select: {
          jobReference: true,
          preferredDate: true,
          address: true,
          Property: { select: { name: true } },
        },
      },
    },
  });
  return row;
}

export async function submitCleanerFeedbackResponse(
  feedbackId: string,
  cleanerId: string,
  response: string
) {
  const trimmed = response.trim();
  if (!trimmed) throw new Error('Response is required');
  if (trimmed.length > 4000) throw new Error('Response is too long');

  const existing = await prisma.serviceFeedback.findFirst({
    where: {
      id: feedbackId,
      cleanerId,
      status: {
        in: [ServiceFeedbackStatus.RELEASED, ServiceFeedbackStatus.RESOLVED],
      },
      releasedAt: { not: null },
    },
  });
  if (!existing) {
    throw new Error('Feedback not found or not released to you');
  }
  if (existing.cleanerRespondedAt) {
    throw new Error('A response was already submitted');
  }

  const updated = await prisma.serviceFeedback.update({
    where: { id: feedbackId },
    data: {
      cleanerResponse: trimmed,
      cleanerRespondedAt: new Date(),
    },
  });

  await logAuditEntry({
    actorId: cleanerId,
    actorRole: 'CLEANER',
    action: 'FEEDBACK_CLEANER_RESPONSE',
    entityType: 'ServiceFeedback',
    entityId: feedbackId,
    description: 'Cleaner added internal response to released feedback',
  });

  return updated;
}

/**
 * Claim and send at most one reminder per ServiceFeedback (atomic claim).
 */
export async function claimFeedbackReminders(limit = 50): Promise<ServiceFeedback[]> {
  const cutoff = new Date(Date.now() - feedbackReminderHours() * 60 * 60 * 1000);

  const candidates = await prisma.serviceFeedback.findMany({
    where: {
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
      reminderSentAt: null,
      requestedAt: { lte: cutoff },
    },
    orderBy: { requestedAt: 'asc' },
    take: limit,
  });

  const claimed: ServiceFeedback[] = [];
  for (const row of candidates) {
    const result = await prisma.serviceFeedback.updateMany({
      where: {
        id: row.id,
        status: ServiceFeedbackStatus.REQUESTED,
        submittedAt: null,
        reminderSentAt: null,
      },
      data: { reminderSentAt: new Date() },
    });
    if (result.count === 1) {
      const refreshed = await prisma.serviceFeedback.findUnique({
        where: { id: row.id },
      });
      if (refreshed) claimed.push(refreshed);
    }
  }
  return claimed;
}

export async function getFeedbackWorkflowState(jobId: string) {
  const row = await prisma.serviceFeedback.findUnique({ where: { jobId } });
  if (!row) {
    return {
      state: 'pending' as const,
      requestedAt: null as string | null,
      submittedAt: null as string | null,
      reminderSentAt: null as string | null,
      status: null as ServiceFeedbackStatus | null,
      overallRating: null as number | null,
      feedbackId: null as string | null,
      publicToken: null as string | null,
    };
  }
  const state =
    row.submittedAt || row.status !== ServiceFeedbackStatus.REQUESTED
      ? ('done' as const)
      : ('ready' as const);
  return {
    state,
    requestedAt: row.requestedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reminderSentAt: row.reminderSentAt?.toISOString() ?? null,
    status: row.status,
    overallRating: row.overallRating,
    feedbackId: row.id,
    publicToken: row.publicToken,
  };
}
