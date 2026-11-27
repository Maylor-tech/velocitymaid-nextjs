/**
 * Client change requests (portal "Request change"): list, approve, decline.
 * Approving a new date moves the clean and keeps Google Calendar in step.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';
import { parseServiceDateInput } from '@/lib/dates/serviceDate';

export class ChangeRequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type ChangeRequestPayload = {
  newDate?: string | null;
  newStartTime?: string | null;
  newDuration?: number | null;
  newAddress?: string | null;
  notes?: string | null;
  originalDate?: string | null;
  originalTime?: string | null;
  originalAddress?: string | null;
  decision?: { action: 'APPROVED' | 'DECLINED'; at: string; by: string | null; note: string | null };
};

const TERMINAL = ['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY'];

/** Pure: what approving would change on the job. Tested without a database. */
export function changesFromPayload(
  payload: ChangeRequestPayload,
  job: { preferredDate: Date | null; guestCheckOutDate: Date | null }
): { preferredDate?: Date; guestCheckOutDate?: Date; preferredTime?: string; manualFollowUp: string[] } {
  const out: { preferredDate?: Date; guestCheckOutDate?: Date; preferredTime?: string; manualFollowUp: string[] } = {
    manualFollowUp: [],
  };
  if (payload.newDate) {
    const day = parseServiceDateInput(payload.newDate.slice(0, 10));
    if (!day) throw new ChangeRequestError('The requested date is not valid.');
    out.preferredDate = day;
    // A turnover's checkout day moves with it when they were the same day.
    if (
      job.guestCheckOutDate &&
      job.preferredDate &&
      job.guestCheckOutDate.getTime() === job.preferredDate.getTime()
    ) {
      out.guestCheckOutDate = day;
    }
  }
  if (payload.newStartTime) out.preferredTime = payload.newStartTime;
  if (payload.newAddress) out.manualFollowUp.push('New address requested: update the property by hand.');
  if (payload.newDuration) out.manualFollowUp.push('New duration requested: adjust the price or crew by hand.');
  return out;
}

export async function listChangeRequests(opts: { status?: 'PENDING' | 'ALL'; jobId?: string; branchIds?: string[] }) {
  const where: Prisma.CustomerJobChangeRequestWhereInput = {};
  if (opts.status !== 'ALL') where.status = 'PENDING';
  if (opts.jobId) where.jobId = opts.jobId;
  if (opts.branchIds) where.Job = { branchId: { in: opts.branchIds } };
  const rows = await prisma.customerJobChangeRequest.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      status: true,
      requestedAt: true,
      payload: true,
      Customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      Job: {
        select: {
          id: true,
          jobReference: true,
          status: true,
          preferredDate: true,
          preferredTime: true,
          assignedCleanerId: true,
          Property: { select: { name: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    payload: r.payload as ChangeRequestPayload,
    customer: {
      id: r.Customer.id,
      name: `${r.Customer.firstName} ${r.Customer.lastName}`.trim() || r.Customer.email,
    },
    job: {
      id: r.Job.id,
      reference: r.Job.jobReference,
      status: r.Job.status,
      date: r.Job.preferredDate?.toISOString() ?? null,
      time: r.Job.preferredTime,
      hasCleaner: Boolean(r.Job.assignedCleanerId),
      property: r.Job.Property?.name ?? null,
    },
  }));
}

export async function decideChangeRequest(params: {
  id: string;
  action: 'approve' | 'decline';
  note?: string | null;
  actorId?: string | null;
  branchIds?: string[];
}) {
  const cr = await prisma.customerJobChangeRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      payload: true,
      Job: {
        select: {
          id: true,
          jobReference: true,
          status: true,
          branchId: true,
          preferredDate: true,
          guestCheckOutDate: true,
        },
      },
    },
  });
  if (!cr) throw new ChangeRequestError('Request not found', 404);
  if (params.branchIds && !params.branchIds.includes(cr.Job.branchId ?? '')) {
    throw new ChangeRequestError('Request not found', 404);
  }
  if (cr.status !== 'PENDING') throw new ChangeRequestError('This request was already handled.', 409);

  const payload = (cr.payload ?? {}) as ChangeRequestPayload;
  const note = params.note?.trim() || null;
  const decision = {
    action: params.action === 'approve' ? ('APPROVED' as const) : ('DECLINED' as const),
    at: new Date().toISOString(),
    by: params.actorId ?? null,
    note,
  };

  let manualFollowUp: string[] = [];
  if (params.action === 'approve') {
    if (TERMINAL.includes(cr.Job.status)) {
      throw new ChangeRequestError('The clean is already completed or cancelled. Decline the request instead.', 409);
    }
    const changes = changesFromPayload(payload, cr.Job);
    manualFollowUp = changes.manualFollowUp;
    const data: Prisma.JobUpdateInput = {};
    if (changes.preferredDate) data.preferredDate = changes.preferredDate;
    if (changes.guestCheckOutDate) data.guestCheckOutDate = changes.guestCheckOutDate;
    if (changes.preferredTime) data.preferredTime = changes.preferredTime;
    if (Object.keys(data).length) {
      await prisma.job.update({ where: { id: cr.Job.id }, data });
    }
  }

  const updated = await prisma.customerJobChangeRequest.updateMany({
    where: { id: cr.id, status: 'PENDING' },
    data: {
      status: decision.action,
      payload: { ...payload, decision } as Prisma.InputJsonValue,
    },
  });
  if (updated.count !== 1) throw new ChangeRequestError('This request was already handled.', 409);

  if (params.action === 'approve') await awaitJobCalendarSync(cr.Job.id);

  await logAuditEntry({
    actorId: params.actorId ?? null,
    actorRole: 'ADMIN',
    action: decision.action === 'APPROVED' ? 'JOB_CHANGE_REQUEST_APPROVED' : 'JOB_CHANGE_REQUEST_DECLINED',
    entityType: 'Job',
    entityId: cr.Job.id,
    description: `${cr.Job.jobReference ?? cr.Job.id}: change request ${decision.action.toLowerCase()}${note ? ` (${note})` : ''}`,
    changes: { requestId: cr.id, payload } as unknown as Prisma.InputJsonValue,
  });

  return { status: decision.action, jobId: cr.Job.id, manualFollowUp };
}
