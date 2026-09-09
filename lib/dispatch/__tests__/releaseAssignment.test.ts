import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobOfferStatus, JobStatus } from '@prisma/client';

const jobFindUnique = vi.fn();
const offerFindFirst = vi.fn();
const offerCreate = vi.fn();
const offerUpdate = vi.fn();
const payoutFindUnique = vi.fn();
const transaction = vi.fn();
const awaitJobCalendarSync = vi.fn();
const cancelJobCalendarEventById = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    jobOffer: {
      findFirst: (...a: unknown[]) => offerFindFirst(...a),
      create: (...a: unknown[]) => offerCreate(...a),
      update: (...a: unknown[]) => offerUpdate(...a),
    },
    jobPayout: { findUnique: (...a: unknown[]) => payoutFindUnique(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: (...a: unknown[]) => awaitJobCalendarSync(...a),
}));

vi.mock('@/lib/google/calendar', () => ({
  cancelJobCalendarEventById: (...a: unknown[]) => cancelJobCalendarEventById(...a),
}));

import { releaseAssignedCleaner } from '../releaseAssignment';

const offeredAt = new Date('2026-09-08T14:02:42.691Z');
const expiresAt = new Date('2026-09-08T16:02:42.691Z');
const respondedAt = new Date('2026-09-08T14:06:22.059Z');

function vm20260028LikeJob() {
  return {
    id: 'job-oct4',
    status: JobStatus.ASSIGNED,
    assignedCleanerId: 'user-dorottya',
    assignedAt: offeredAt,
    startedAt: null,
    branchId: 'branch-vt',
    paymentStatus: 'PENDING',
    quotedTotal: 265,
    totalPrice: 265,
    operationalTotal: 200,
    jobReference: 'VM-2026-0028',
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

function txMocks(updateCount = 1) {
  const jobUpdateMany = vi.fn().mockResolvedValue({ count: updateCount });
  const jobFindAfter = vi.fn().mockResolvedValue({
    id: 'job-oct4',
    status: JobStatus.CONFIRMED,
    assignedCleanerId: null,
    paymentStatus: 'PENDING',
    quotedTotal: 265,
    totalPrice: 265,
    operationalTotal: 200,
  });
  const teamDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const assignmentLogCreate = vi.fn().mockResolvedValue({ id: 'alog-1' });
  const auditLogCreate = vi.fn().mockResolvedValue({ id: 'audit-1' });
  return {
    jobUpdateMany,
    jobFindAfter,
    teamDeleteMany,
    assignmentLogCreate,
    auditLogCreate,
    tx: {
      job: { updateMany: jobUpdateMany, findUnique: jobFindAfter },
      jobTeamMember: { deleteMany: teamDeleteMany },
      assignmentLog: { create: assignmentLogCreate },
      auditLog: { create: auditLogCreate },
      jobOffer: { update: offerUpdate, create: offerCreate },
    },
  };
}

describe('releaseAssignedCleaner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    payoutFindUnique.mockResolvedValue(null);
    awaitJobCalendarSync.mockResolvedValue(undefined);
    jobFindUnique.mockResolvedValue(vm20260028LikeJob());
    offerFindFirst.mockResolvedValue(acceptedOffer());
  });

  it('releases an assigned cleaner while preserving the accepted offer and compensation', async () => {
    const { tx, jobUpdateMany, assignmentLogCreate, auditLogCreate } = txMocks();
    transaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(tx));

    const result = await releaseAssignedCleaner({
      jobId: 'job-oct4',
      expectedCleanerId: 'user-dorottya',
      reason: 'CLEANER_UNAVAILABLE',
      notes: 'Cannot work October 4',
      adminId: 'admin-1',
    });

    expect(result.job.assignedCleanerId).toBeNull();
    expect(result.job.status).toBe(JobStatus.CONFIRMED);
    expect(result.job.paymentStatus).toBe('PENDING');
    expect(result.job.quotedTotal).toBe(265);
    expect(result.job.totalPrice).toBe(265);
    expect(result.offer?.id).toBe('offer-accepted-1');
    expect(result.offer?.status).toBe('ACCEPTED');
    expect(result.offer?.compensationAmount).toBe(172.25);
    expect(result.offer?.compensationBasis).toBe('FLAT');
    expect(result.offer?.offeredAt).toEqual(offeredAt);
    expect(result.offer?.expiresAt).toEqual(expiresAt);

    expect(jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-oct4', assignedCleanerId: 'user-dorottya' },
        data: expect.objectContaining({
          assignedCleanerId: null,
          status: JobStatus.CONFIRMED,
        }),
      })
    );
    expect(offerUpdate).not.toHaveBeenCalled();
    expect(offerCreate).not.toHaveBeenCalled();
    expect(assignmentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: 'RELEASED',
          cleanerId: 'user-dorottya',
        }),
      })
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'JOB_ASSIGNMENT_RELEASED',
          entityId: 'job-oct4',
        }),
      })
    );
    expect(awaitJobCalendarSync).toHaveBeenCalledWith('job-oct4');
    expect(cancelJobCalendarEventById).not.toHaveBeenCalled();
  });

  it('rejects a VM-2026-0028-like completed job without mutating the offer', async () => {
    jobFindUnique.mockResolvedValue({
      ...vm20260028LikeJob(),
      status: JobStatus.COMPLETED,
    });
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        expectedCleanerId: 'user-dorottya',
        reason: 'ADMIN_CORRECTION',
      })
    ).rejects.toMatchObject({ code: 'JOB_COMPLETED', status: 409 });
    expect(transaction).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it('rejects cancelled jobs', async () => {
    jobFindUnique.mockResolvedValue({
      ...vm20260028LikeJob(),
      status: JobStatus.CANCELLED,
    });
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        reason: 'ADMIN_CORRECTION',
      })
    ).rejects.toMatchObject({ code: 'JOB_CANCELLED', status: 409 });
  });

  it('rejects in-progress jobs', async () => {
    jobFindUnique.mockResolvedValue({
      ...vm20260028LikeJob(),
      status: JobStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        reason: 'CLEANER_UNAVAILABLE',
      })
    ).rejects.toMatchObject({ code: 'JOB_IN_PROGRESS', status: 409 });
  });

  it('rejects double release', async () => {
    jobFindUnique.mockResolvedValue({
      ...vm20260028LikeJob(),
      assignedCleanerId: null,
      status: JobStatus.CONFIRMED,
    });
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        reason: 'CLEANER_UNAVAILABLE',
      })
    ).rejects.toMatchObject({ code: 'NOT_ASSIGNED', status: 409 });
  });

  it('rejects the wrong expected cleaner', async () => {
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        expectedCleanerId: 'someone-else',
        reason: 'CLEANER_UNAVAILABLE',
      })
    ).rejects.toMatchObject({ code: 'CLEANER_MISMATCH', status: 409 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects concurrent assignment changes', async () => {
    const { tx } = txMocks(0);
    transaction.mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn(tx));
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        expectedCleanerId: 'user-dorottya',
        reason: 'CLEANER_UNAVAILABLE',
      })
    ).rejects.toMatchObject({ code: 'CONCURRENT_ASSIGNMENT_CHANGE', status: 409 });
  });

  it('rejects when a payout already exists', async () => {
    payoutFindUnique.mockResolvedValue({ id: 'payout-1' });
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        reason: 'CLEANER_UNAVAILABLE',
      })
    ).rejects.toMatchObject({ code: 'PAYOUT_EXISTS', status: 409 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('requires notes for OTHER', async () => {
    await expect(
      releaseAssignedCleaner({
        jobId: 'job-oct4',
        reason: 'OTHER',
        notes: '',
      })
    ).rejects.toMatchObject({ code: 'RELEASE_NOTES_REQUIRED', status: 400 });
  });
});
