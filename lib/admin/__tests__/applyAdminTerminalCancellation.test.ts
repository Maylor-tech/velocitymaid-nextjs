import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobOfferStatus, JobStatus } from '@prisma/client';

const jobFindUnique = vi.fn();
const offerFindFirst = vi.fn();
const transaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    jobOffer: { findFirst: (...a: unknown[]) => offerFindFirst(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));

import { applyAdminTerminalCancellation } from '../applyAdminTerminalCancellation';
import { JOB_ASSIGNMENT_RELEASED, ASSIGNMENT_RELEASED } from '@/lib/dispatch/releaseReasons';

const offeredAt = new Date('2026-09-08T14:02:42.691Z');

function assignedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-oct4',
    status: JobStatus.ASSIGNED,
    assignedCleanerId: 'user-dorottya',
    assignedAt: offeredAt,
    branchId: 'branch-vt',
    jobReference: 'VM-2026-0028',
    paymentStatus: 'PENDING',
    quotedTotal: 265,
    totalPrice: 265,
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
  };
}

function txMocks(opts?: {
  updateCount?: number;
  afterStatus?: JobStatus;
  openOfferCancelCount?: number;
}) {
  const updateCount = opts?.updateCount ?? 1;
  const afterStatus = opts?.afterStatus ?? JobStatus.CANCELLED;
  const openOfferCancelCount = opts?.openOfferCancelCount ?? 1;

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
    cancellationReason: 'Emergency cancellation',
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

describe('applyAdminTerminalCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ASSIGNED → CANCELLED clears cleaner, team, preserves ACCEPTED offer', async () => {
    jobFindUnique.mockResolvedValue(assignedJob());
    offerFindFirst.mockResolvedValue(acceptedOffer());
    const mocks = txMocks({ afterStatus: JobStatus.CANCELLED });
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(mocks.tx)
    );

    const result = await applyAdminTerminalCancellation({
      jobId: 'job-oct4',
      adminId: 'admin-1',
      nextStatus: JobStatus.CANCELLED,
      reasonLabel: 'Admin cancelled job',
      reasonCode: 'ADMIN_CANCELLED',
      extraJobData: {
        cancelledAt: new Date(),
        cancellationReason: 'Admin cancel',
      },
    });

    expect(result.releasedCleanerId).toBe('user-dorottya');
    expect(result.job.assignedCleanerId).toBeNull();
    expect(result.job.assignedAt).toBeNull();
    expect(result.job.status).toBe(JobStatus.CANCELLED);
    expect(result.acceptedOffer?.status).toBe(JobOfferStatus.ACCEPTED);
    expect(result.acceptedOffer?.compensationAmount).toBe(172.25);

    expect(mocks.jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'job-oct4',
          assignedCleanerId: 'user-dorottya',
        },
        data: expect.objectContaining({
          assignedCleanerId: null,
          assignedAt: null,
          status: JobStatus.CANCELLED,
        }),
      })
    );
    expect(mocks.teamDeleteMany).toHaveBeenCalledWith({
      where: { jobId: 'job-oct4' },
    });
    expect(mocks.assignmentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outcome: ASSIGNMENT_RELEASED,
          cleanerId: 'user-dorottya',
        }),
      })
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: JOB_ASSIGNMENT_RELEASED,
        }),
      })
    );
    expect(mocks.offerUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          jobId: 'job-oct4',
          status: JobOfferStatus.OFFERED,
        },
        data: expect.objectContaining({
          status: JobOfferStatus.CANCELLED,
        }),
      })
    );
    // Offer find only — never rewrite ACCEPTED
    expect(offerFindFirst).toHaveBeenCalled();
    expect(result.job.paymentStatus).toBe('PENDING');
    expect(result.job.quotedTotal).toBe(265);
    expect(result.job.totalPrice).toBe(265);
  });

  it('ASSIGNED → CANCELLED_EMERGENCY clears cleaner and cancels open offers', async () => {
    jobFindUnique.mockResolvedValue(assignedJob());
    offerFindFirst.mockResolvedValue(acceptedOffer());
    const mocks = txMocks({
      afterStatus: JobStatus.CANCELLED_EMERGENCY,
      openOfferCancelCount: 2,
    });
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(mocks.tx)
    );

    const result = await applyAdminTerminalCancellation({
      jobId: 'job-oct4',
      adminId: 'admin-1',
      nextStatus: JobStatus.CANCELLED_EMERGENCY,
      reasonLabel: 'Emergency cancellation',
      reasonCode: 'EMERGENCY',
      extraJobData: {
        cancelledAt: new Date(),
        cancellationReason: 'Emergency cancellation',
      },
      auditAction: 'JOB_EMERGENCY_CANCELLED',
    });

    expect(result.job.status).toBe(JobStatus.CANCELLED_EMERGENCY);
    expect(result.releasedCleanerId).toBe('user-dorottya');
    expect(result.cancelledOpenOfferCount).toBe(2);
    expect(result.acceptedOffer?.id).toBe('offer-accepted-1');
    // assignment release audit + terminal cancel audit
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(2);
  });

  it('unassigned cancel still works without release logs', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ assignedCleanerId: null, assignedAt: null, status: JobStatus.CONFIRMED })
    );
    const mocks = txMocks({ afterStatus: JobStatus.CANCELLED, openOfferCancelCount: 0 });
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(mocks.tx)
    );

    const result = await applyAdminTerminalCancellation({
      jobId: 'job-oct4',
      adminId: 'admin-1',
      nextStatus: JobStatus.CANCELLED,
      reasonLabel: 'Admin cancelled job',
      reasonCode: 'ADMIN_CANCELLED',
      extraJobData: { cancelledAt: new Date() },
    });

    expect(result.releasedCleanerId).toBeNull();
    expect(offerFindFirst).not.toHaveBeenCalled();
    expect(mocks.teamDeleteMany).not.toHaveBeenCalled();
    expect(mocks.assignmentLogCreate).not.toHaveBeenCalled();
    expect(mocks.jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assignedCleanerId: null,
        }),
        data: expect.objectContaining({
          status: JobStatus.CANCELLED,
        }),
      })
    );
  });

  it('rejects already-cancelled jobs', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ status: JobStatus.CANCELLED, assignedCleanerId: null })
    );

    await expect(
      applyAdminTerminalCancellation({
        jobId: 'job-oct4',
        adminId: 'admin-1',
        nextStatus: JobStatus.CANCELLED,
        reasonLabel: 'Admin cancelled job',
        reasonCode: 'ADMIN_CANCELLED',
      })
    ).rejects.toMatchObject({ code: 'JOB_ALREADY_CANCELLED' });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('blocks COMPLETED → CANCELLED by default with no mutation', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({
        status: JobStatus.COMPLETED,
        assignedCleanerId: 'user-dorottya',
        paymentStatus: 'PAID',
      })
    );

    await expect(
      applyAdminTerminalCancellation({
        jobId: 'job-oct4',
        adminId: 'admin-1',
        nextStatus: JobStatus.CANCELLED,
        reasonLabel: 'Admin cancelled job',
        reasonCode: 'ADMIN_CANCELLED',
      })
    ).rejects.toMatchObject({ code: 'JOB_COMPLETED', status: 400 });

    expect(offerFindFirst).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('blocks COMPLETED → CANCELLED_EMERGENCY by default', async () => {
    jobFindUnique.mockResolvedValue(
      assignedJob({ status: JobStatus.COMPLETED, assignedCleanerId: null })
    );

    await expect(
      applyAdminTerminalCancellation({
        jobId: 'job-oct4',
        adminId: 'admin-1',
        nextStatus: JobStatus.CANCELLED_EMERGENCY,
        reasonLabel: 'Emergency cancellation',
        reasonCode: 'EMERGENCY',
      })
    ).rejects.toMatchObject({ code: 'JOB_COMPLETED', status: 400 });

    expect(transaction).not.toHaveBeenCalled();
  });
});
