import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobOfferStatus, JobStatus } from '@prisma/client';

const jobFindUnique = vi.fn();
const offerFindFirst = vi.fn();
const payoutFindUnique = vi.fn();
const transaction = vi.fn();
const awaitJobCalendarCancel = vi.fn();
const awaitJobCalendarSync = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    jobOffer: { findFirst: (...a: unknown[]) => offerFindFirst(...a) },
    jobPayout: { findUnique: (...a: unknown[]) => payoutFindUnique(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarCancel: (...a: unknown[]) => awaitJobCalendarCancel(...a),
  awaitJobCalendarSync: (...a: unknown[]) => awaitJobCalendarSync(...a),
}));

import { cancelCustomerJob } from '../cancelCustomerJob';
import {
  isCancelledStatus,
  isCustomerCancellableStatus,
} from '@/lib/jobStatus';

const preferredDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
const offeredAt = new Date('2026-09-08T14:02:42.691Z');
const expiresAt = new Date('2026-09-08T16:02:42.691Z');
const respondedAt = new Date('2026-09-08T14:06:22.059Z');

function assignedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-oct4',
    customerId: 'cust-tiffany',
    status: JobStatus.ASSIGNED,
    assignedCleanerId: 'user-dorottya',
    assignedAt: offeredAt,
    startedAt: null,
    preferredDate,
    branchId: 'branch-vt',
    paymentStatus: 'PENDING',
    quotedTotal: 265,
    totalPrice: 265,
    operationalTotal: 200,
    jobReference: 'VM-2026-0028',
    cancellationReason: null,
    cancelledAt: null,
    ...overrides,
  };
}

function acceptedOffer() {
  return {
    id: 'offer-accepted-1',
    jobId: 'job-oct4',
    cleanerId: 'user-dorottya',
    status: JobOfferStatus.ACCEPTED,
    compensationAmount: 172.25,
    compensationBasis: 'FLAT',
    offeredAt,
    expiresAt,
    respondedAt,
  };
}

function txMocks(opts?: {
  updateCount?: number;
  openOfferCancelCount?: number;
  afterStatus?: JobStatus;
}) {
  const updateCount = opts?.updateCount ?? 1;
  const openOfferCancelCount = opts?.openOfferCancelCount ?? 0;
  const afterStatus = opts?.afterStatus ?? JobStatus.CANCELLED;

  const jobUpdateMany = vi.fn().mockResolvedValue({ count: updateCount });
  const jobFindAfter = vi.fn().mockResolvedValue({
    id: 'job-oct4',
    status: afterStatus,
    assignedCleanerId: null,
    assignedAt: null,
    paymentStatus: 'PENDING',
    quotedTotal: 265,
    totalPrice: 265,
    operationalTotal: 200,
    cancellationReason: 'Guest cancelled reservation',
    cancelledAt: new Date(),
  });
  const teamDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const assignmentLogCreate = vi.fn().mockResolvedValue({ id: 'alog-1' });
  const auditLogCreate = vi.fn().mockResolvedValue({ id: 'audit-1' });
  const offerUpdateMany = vi
    .fn()
    .mockResolvedValue({ count: openOfferCancelCount });

  return {
    jobUpdateMany,
    jobFindAfter,
    teamDeleteMany,
    assignmentLogCreate,
    auditLogCreate,
    offerUpdateMany,
    tx: {
      job: { updateMany: jobUpdateMany, findUnique: jobFindAfter },
      jobTeamMember: { deleteMany: teamDeleteMany },
      assignmentLog: { create: assignmentLogCreate },
      auditLog: { create: auditLogCreate },
      jobOffer: { updateMany: offerUpdateMany },
    },
  };
}

describe('customer cancellation status helpers', () => {
  it('allows ASSIGNED / CONFIRMED / RECEIVED via canonical JobStatus', () => {
    expect(isCustomerCancellableStatus('ASSIGNED')).toBe(true);
    expect(isCustomerCancellableStatus('assigned')).toBe(true);
    expect(isCustomerCancellableStatus(JobStatus.CONFIRMED)).toBe(true);
    expect(isCustomerCancellableStatus(JobStatus.RECEIVED)).toBe(true);
  });

  it('blocks in-service and terminal statuses for customer cancel UI/API', () => {
    expect(isCustomerCancellableStatus(JobStatus.ON_THE_WAY)).toBe(false);
    expect(isCustomerCancellableStatus(JobStatus.IN_PROGRESS)).toBe(false);
    expect(isCustomerCancellableStatus(JobStatus.AWAITING_QC)).toBe(false);
    expect(isCustomerCancellableStatus(JobStatus.COMPLETED)).toBe(false);
    expect(isCustomerCancellableStatus(JobStatus.CANCELLED)).toBe(false);
    expect(isCancelledStatus(JobStatus.CANCELLED)).toBe(true);
    expect(isCancelledStatus(JobStatus.CANCELLED_EMERGENCY)).toBe(true);
  });
});

describe('cancelCustomerJob — ASSIGNED integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    payoutFindUnique.mockResolvedValue(null);
    awaitJobCalendarCancel.mockResolvedValue(undefined);
    jobFindUnique.mockResolvedValue(assignedJob());
    offerFindFirst.mockResolvedValue(acceptedOffer());
  });

  it('cancels an ASSIGNED future job, clears assignment, preserves ACCEPTED offer + pay', async () => {
    const {
      tx,
      jobUpdateMany,
      teamDeleteMany,
      assignmentLogCreate,
      auditLogCreate,
      offerUpdateMany,
    } = txMocks({ openOfferCancelCount: 0 });
    transaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) =>
      fn(tx)
    );

    const result = await cancelCustomerJob({
      jobId: 'job-oct4',
      customerId: 'cust-tiffany',
      reason: 'Guest cancelled reservation',
    });

    expect(result.job.status).toBe(JobStatus.CANCELLED);
    expect(result.job.assignedCleanerId).toBeNull();
    expect(result.job.assignedAt).toBeNull();
    expect(result.job.cancellationReason).toBe('Guest cancelled reservation');
    expect(result.job.cancelledAt).toBeTruthy();
    expect(result.job.paymentStatus).toBe('PENDING');
    expect(result.job.quotedTotal).toBe(265);
    expect(result.job.totalPrice).toBe(265);
    expect(result.releasedCleanerId).toBe('user-dorottya');
    expect(result.acceptedOffer?.status).toBe('ACCEPTED');
    expect(result.acceptedOffer?.compensationAmount).toBe(172.25);
    expect(result.acceptedOffer?.compensationBasis).toBe('FLAT');

    expect(jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-oct4', assignedCleanerId: 'user-dorottya' },
        data: expect.objectContaining({
          assignedCleanerId: null,
          assignedAt: null,
          status: JobStatus.CANCELLED,
          cancellationReason: 'Guest cancelled reservation',
        }),
      })
    );
    expect(teamDeleteMany).toHaveBeenCalledWith({ where: { jobId: 'job-oct4' } });
    expect(assignmentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: 'RELEASED',
          cleanerId: 'user-dorottya',
        }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalled();
    expect(offerUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: 'job-oct4', status: JobOfferStatus.OFFERED },
        data: expect.objectContaining({ status: JobOfferStatus.CANCELLED }),
      })
    );
    expect(awaitJobCalendarCancel).toHaveBeenCalledWith('job-oct4');
    expect(awaitJobCalendarSync).not.toHaveBeenCalled();
  });

  it('cancels outstanding OFFERED rows without rewriting ACCEPTED history', async () => {
    const { tx, offerUpdateMany } = txMocks({ openOfferCancelCount: 2 });
    transaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) =>
      fn(tx)
    );

    const result = await cancelCustomerJob({
      jobId: 'job-oct4',
      customerId: 'cust-tiffany',
      reason: 'Guest cancelled',
    });

    expect(result.cancelledOpenOfferCount).toBe(2);
    expect(result.acceptedOffer?.status).toBe('ACCEPTED');
    expect(offerUpdateMany).toHaveBeenCalledTimes(1);
  });

  it('cancels CONFIRMED (unassigned) jobs without assignment release logs', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({
        status: JobStatus.CONFIRMED,
        assignedCleanerId: null,
        assignedAt: null,
      })
    );
    offerFindFirst.mockResolvedValue(null);
    const { tx, jobUpdateMany, assignmentLogCreate, teamDeleteMany } = txMocks();
    transaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) =>
      fn(tx)
    );

    const result = await cancelCustomerJob({
      jobId: 'job-oct4',
      customerId: 'cust-tiffany',
    });

    expect(result.job.status).toBe(JobStatus.CANCELLED);
    expect(result.releasedCleanerId).toBeNull();
    expect(jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'job-oct4',
          assignedCleanerId: null,
        }),
        data: expect.objectContaining({ status: JobStatus.CANCELLED }),
      })
    );
    expect(assignmentLogCreate).not.toHaveBeenCalled();
    expect(teamDeleteMany).not.toHaveBeenCalled();
  });

  it('rejects another customer cancelling the job', async () => {
    await expect(
      cancelCustomerJob({
        jobId: 'job-oct4',
        customerId: 'someone-else',
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 403 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects already CANCELLED jobs', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ status: JobStatus.CANCELLED, assignedCleanerId: null })
    );
    await expect(
      cancelCustomerJob({ jobId: 'job-oct4', customerId: 'cust-tiffany' })
    ).rejects.toMatchObject({ code: 'JOB_CANCELLED', status: 400 });
  });

  it('rejects COMPLETED jobs', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ status: JobStatus.COMPLETED })
    );
    await expect(
      cancelCustomerJob({ jobId: 'job-oct4', customerId: 'cust-tiffany' })
    ).rejects.toMatchObject({ code: 'JOB_COMPLETED', status: 400 });
  });

  it('rejects in-service states', async () => {
    for (const status of [
      JobStatus.ON_THE_WAY,
      JobStatus.IN_PROGRESS,
      JobStatus.AWAITING_QC,
    ]) {
      jobFindUnique.mockResolvedValue(assignedJob({ status }));
      await expect(
        cancelCustomerJob({ jobId: 'job-oct4', customerId: 'cust-tiffany' })
      ).rejects.toMatchObject({ code: 'JOB_IN_PROGRESS', status: 400 });
    }
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects when the 2-hour cancellation window is closed', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ preferredDate: new Date(Date.now() + 30 * 60 * 1000) })
    );
    await expect(
      cancelCustomerJob({ jobId: 'job-oct4', customerId: 'cust-tiffany' })
    ).rejects.toMatchObject({ code: 'CANCEL_WINDOW_CLOSED', status: 400 });
  });
});
