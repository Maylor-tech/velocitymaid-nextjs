import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobOfferStatus, JobStatus, Prisma } from '@prisma/client';

const jobFindUnique = vi.fn();
const offerFindFirst = vi.fn();
const offerFindUnique = vi.fn();
const offerFindMany = vi.fn();
const offerCreate = vi.fn();
const offerUpdate = vi.fn();
const userFindUnique = vi.fn();
const applicationFindFirst = vi.fn();
const jobUpdate = vi.fn();
const queryRaw = vi.fn();
const teamDeleteMany = vi.fn();
const teamCreate = vi.fn();
const assignmentLogCreate = vi.fn();
const auditLogCreate = vi.fn();
const transaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a), update: (...a: unknown[]) => jobUpdate(...a) },
    jobOffer: {
      findFirst: (...a: unknown[]) => offerFindFirst(...a),
      findUnique: (...a: unknown[]) => offerFindUnique(...a),
      findMany: (...a: unknown[]) => offerFindMany(...a),
      create: (...a: unknown[]) => offerCreate(...a),
      update: (...a: unknown[]) => offerUpdate(...a),
    },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    cleanerApplication: { findFirst: (...a: unknown[]) => applicationFindFirst(...a) },
    jobTeamMember: {
      deleteMany: (...a: unknown[]) => teamDeleteMany(...a),
      create: (...a: unknown[]) => teamCreate(...a),
    },
    assignmentLog: { create: (...a: unknown[]) => assignmentLogCreate(...a) },
    auditLog: { create: (...a: unknown[]) => auditLogCreate(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
    $queryRaw: (...a: unknown[]) => queryRaw(...a),
  },
}));

vi.mock('@/lib/audit', () => ({ logAuditEntry: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/dispatch/notifyOffer', () => ({
  notifyCleanerOfOffer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: vi.fn().mockResolvedValue({ ok: true }),
  adminNotificationHelpers: { adminJobLink: (id: string) => `/admin/jobs/${id}` },
}));

import { acceptJobOffer, createJobOffer, expireOpenOffers } from '../jobOffer';
import { DispatchError } from '../errors';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';

function baseJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    jobReference: 'VM-TEST-1',
    status: JobStatus.RECEIVED,
    paymentStatus: 'PENDING',
    reviewStatus: 'PENDING',
    billingPolicy: 'INVOICE_AFTER_SERVICE',
    assignedCleanerId: null,
    branchId: 'branch-vt',
    operationalTotal: 200,
    quotedTotal: 300,
    totalPrice: 337.8,
    estimatedDurationMins: 180,
    internalNotes: null,
    dispatchUrgency: 'SAME_DAY',
    Customer: { billingPolicy: 'INVOICE_AFTER_SERVICE' },
    Branch: { id: 'branch-vt', slug: 'vermont', country: 'US' },
    ...overrides,
  };
}

function cleanerRow() {
  return {
    id: 'cleaner-1',
    email: 'brian@example.com',
    name: 'Brian',
    isActive: true,
    primaryBranchId: 'branch-vt',
    UserBranch: [],
    TrainingStatus: { overallStatus: 'PASSED' },
    CleanerProfile: { isInternalTeam: true },
  };
}

describe('createJobOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUnique.mockResolvedValue(cleanerRow());
    applicationFindFirst.mockResolvedValue({ id: 'app-1' });
    offerFindFirst.mockResolvedValue(null);
    offerCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'offer-1',
      ...data,
    }));
  });

  it('blocks PREPAY unpaid jobs via isJobAssignable', async () => {
    jobFindUnique.mockResolvedValue(
      baseJob({
        billingPolicy: 'PREPAY',
        paymentStatus: 'PENDING',
        Customer: { billingPolicy: 'PREPAY' },
      })
    );
    await expect(
      createJobOffer({
        jobId: 'job-1',
        cleanerId: 'cleaner-1',
        compensationAmount: 130,
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_REQUIRED' });
  });

  it('allows INVOICE_AFTER_SERVICE + PENDING', async () => {
    jobFindUnique.mockResolvedValue(baseJob());
    const offer = await createJobOffer({
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      compensationAmount: 130,
    });
    expect(offer.status).toBe(JobOfferStatus.OFFERED);
    expect(offerCreate).toHaveBeenCalled();
    expect(jobUpdate).not.toHaveBeenCalled();
    expect(offerCreate.mock.calls[0][0].data).toMatchObject({
      compensationAmount: 130,
      compensationBasis: 'FLAT',
    });
  });

  it('stores an explicit hourly compensation basis', async () => {
    jobFindUnique.mockResolvedValue(baseJob());
    await createJobOffer({
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      compensationAmount: 130,
      compensationBasis: 'HOURLY',
    });
    expect(offerCreate.mock.calls[0][0].data.compensationBasis).toBe('HOURLY');
  });

  it('requires ops-approved compensation and rejects customer totals', async () => {
    jobFindUnique.mockResolvedValue(baseJob());
    await expect(
      createJobOffer({
        jobId: 'job-1',
        cleanerId: 'cleaner-1',
        compensationAmount: null,
      })
    ).rejects.toThrow(/compensation is required/i);
    await expect(
      createJobOffer({
        jobId: 'job-1',
        cleanerId: 'cleaner-1',
        compensationAmount: 300,
      })
    ).rejects.toThrow(/quoted total/i);
  });
});

describe('acceptJobOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activates assignment without changing paymentStatus or reviewStatus', async () => {
    const now = new Date('2026-08-28T16:10:00.000Z');
    vi.setSystemTime(now);

    const offer = {
      id: 'offer-1',
      jobId: 'job-1',
      cleanerId: 'cleaner-1',
      status: JobOfferStatus.OFFERED,
      expiresAt: new Date('2026-08-28T16:30:00.000Z'),
      Job: {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        paymentStatus: 'PENDING',
        reviewStatus: 'PENDING',
        assignedCleanerId: null,
        branchId: 'branch-vt',
        jobReference: 'VM-TEST-1',
      },
    };

    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        jobOffer: {
          findUnique: vi.fn().mockResolvedValue(offer),
          update: vi.fn().mockResolvedValue({ ...offer, status: JobOfferStatus.ACCEPTED }),
        },
        job: {
          findUnique: vi.fn().mockResolvedValue({
            ...offer.Job,
          }),
          update: vi.fn().mockResolvedValue({
            id: 'job-1',
            paymentStatus: 'PENDING',
            reviewStatus: 'PENDING',
            assignedCleanerId: 'cleaner-1',
            status: JobStatus.ASSIGNED,
          }),
        },
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
        jobTeamMember: { deleteMany: vi.fn(), create: vi.fn() },
        assignmentLog: { create: vi.fn() },
        auditLog: { create: vi.fn() },
      };
      return fn(tx);
    });

    const result = await acceptJobOffer({ offerId: 'offer-1', cleanerId: 'cleaner-1' });
    expect(result.paymentStatus).toBe('PENDING');
    expect(result.jobId).toBe('job-1');
    expect(awaitJobCalendarSync).toHaveBeenCalledWith('job-1');
    vi.useRealTimers();
  });

  it('returns 409 when another accept already assigned the job', async () => {
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        jobOffer: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'offer-1',
            jobId: 'job-1',
            cleanerId: 'cleaner-1',
            status: JobOfferStatus.OFFERED,
            expiresAt: new Date(Date.now() + 60_000),
            Job: { id: 'job-1' },
          }),
        },
        job: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'job-1',
            assignedCleanerId: 'other-cleaner',
            paymentStatus: 'PENDING',
            reviewStatus: 'PENDING',
            status: JobStatus.ASSIGNED,
            branchId: 'branch-vt',
            jobReference: 'VM-TEST-1',
          }),
        },
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
      };
      return fn(tx);
    });

    await expect(
      acceptJobOffer({ offerId: 'offer-1', cleanerId: 'cleaner-1' })
    ).rejects.toMatchObject({ code: 'ALREADY_ASSIGNED', status: 409 });
  });
});

describe('expireOpenOffers', () => {
  it('marks OFFERED rows EXPIRED and does not assign the job', async () => {
    offerFindMany.mockResolvedValue([
      { id: 'offer-1', jobId: 'job-1', Job: { jobReference: 'VM-TEST-1' } },
    ]);
    offerUpdate.mockResolvedValue({ id: 'offer-1', status: JobOfferStatus.EXPIRED });
    const result = await expireOpenOffers(new Date('2026-08-28T17:00:00.000Z'));
    expect(result.expired).toBe(1);
    expect(jobUpdate).not.toHaveBeenCalled();
  });
});

describe('serializable isolation is requested on accept', () => {
  it('uses Prisma serializable transactions', async () => {
    transaction.mockRejectedValue(
      new DispatchError('stop', 'STOP', 500)
    );
    await expect(
      acceptJobOffer({ offerId: 'offer-1', cleanerId: 'cleaner-1' })
    ).rejects.toBeInstanceOf(DispatchError);
    expect(transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  });
});
