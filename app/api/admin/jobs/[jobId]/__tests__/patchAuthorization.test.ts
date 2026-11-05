/**
 * Branch admins cannot change price through the general job PATCH,
 * and assignedCleanerId uses the manual-assignment eligibility rule.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  jobFindUnique: vi.fn(),
  jobUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  applicationFindFirst: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => mocks.requireRole(...args),
  assertOwnerAuthorization: (auth: { isOwner?: boolean }) => {
    if (auth?.isOwner !== true) {
      throw NextResponse.json(
        { success: false, error: 'Forbidden: Owner authorization required' },
        { status: 403 }
      );
    }
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => mocks.jobFindUnique(...args),
      update: (...args: unknown[]) => mocks.jobUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mocks.userFindUnique(...args),
    },
    cleanerApplication: {
      findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => mocks.logAuditEntry(...args),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: vi.fn(),
  awaitJobCalendarCancel: vi.fn(),
}));

vi.mock('@/lib/booking/payoutEligibility', () => ({
  computePayoutEligibility: () => ({ eligible: false }),
}));

vi.mock('@/lib/booking/jobPayment', () => ({
  resolveCompletionPaymentUpdate: () => null,
}));

vi.mock('@/lib/booking/maybeCreatePayoutAfterTransition', () => ({
  maybeCreatePayoutAfterTransition: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/dispatch/featureFlags', () => ({
  isDispatchOffersEnabledForBranch: () => false,
}));

vi.mock('@/lib/dispatch/dispatchState', () => ({
  deriveDispatchUiState: () => ({}),
}));

vi.mock('@/lib/dispatch/offerExpiry', () => ({
  isEffectivelyOpen: () => false,
  effectiveOfferStatus: (status: string) => status,
}));

vi.mock('@/lib/notifications/cleanerCancellationEmail', () => ({
  notifyCleanerOfJobCancellation: vi.fn(),
}));

vi.mock('@/lib/admin/applyAdminTerminalCancellation', () => ({
  applyAdminTerminalCancellation: vi.fn(),
}));

vi.mock('@/lib/dispatch/errors', () => ({
  isDispatchError: () => false,
}));

import { PATCH } from '../route';

const branchAdmin = {
  userId: 'branch-admin-1',
  role: 'ADMIN' as const,
  isOwner: false,
  isBranchScoped: true,
  branchId: 'fictional-vt',
  branchIds: ['fictional-vt'],
};

function existingJob() {
  return {
    id: 'job-1',
    branchId: 'fictional-vt',
    Branch: { country: 'US', slug: 'vermont' },
    preferredDate: new Date('2026-11-04T00:00:00.000Z'),
    preferredTime: '10:00',
    guestCheckInDate: null,
    guestCheckOutDate: null,
    internalNotes: null,
    address: '1 Fictional Lane',
    serviceType: 'Turnover',
    status: 'CONFIRMED',
    totalPrice: 200,
    quotedTotal: 200,
    amountPaid: 0,
    paymentStatus: 'PAID',
    assignedCleanerId: null,
    JobPayout: null,
  };
}

function patch(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/jobs/job-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/admin/jobs/[jobId] price and assignment guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue(branchAdmin);
    mocks.jobFindUnique.mockResolvedValue(existingJob());
    mocks.jobUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...existingJob(),
      ...data,
    }));
    mocks.logAuditEntry.mockResolvedValue(undefined);
    mocks.applicationFindFirst.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
  });

  it('rejects a branch admin price change', async () => {
    const res = await PATCH(patch({ totalPrice: 275 }), { params: { jobId: 'job-1' } });
    expect(res.status).toBe(403);
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });

  it('rejects a multi-branch non-owner price change on an assigned branch', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'multi-1',
      role: 'ADMIN',
      isOwner: false,
      isBranchScoped: false,
      branchIds: ['fictional-vt', 'fictional-nj'],
    });

    const total = await PATCH(patch({ totalPrice: 275 }), { params: { jobId: 'job-1' } });
    expect(total.status).toBe(403);
    const totalJson = await total.json();
    expect(totalJson.error).toBe('Forbidden: Owner authorization required');
    expect(mocks.jobUpdate).not.toHaveBeenCalled();

    const quoted = await PATCH(patch({ quotedTotal: 275 }), { params: { jobId: 'job-1' } });
    expect(quoted.status).toBe(403);
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });

  it('still saves an ordinary job edit for a branch admin', async () => {
    const res = await PATCH(patch({ internalNotes: 'Fictional gate code' }), {
      params: { jobId: 'job-1' },
    });
    expect(res.status).toBe(200);
    expect(mocks.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { internalNotes: 'Fictional gate code' },
      })
    );
    const json = await res.json();
    expect(json.job.totalPrice).toBe(200);
    expect(json.job.internalNotes).toBe('Fictional gate code');
  });

  it('rejects an ineligible cleaner before assignment', async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 'cleaner-new',
      email: 'new@example.test',
      name: 'New Cleaner',
      isActive: true,
      primaryBranchId: 'fictional-vt',
      UserBranch: [{ Branch: { id: 'fictional-vt' } }],
      TrainingStatus: null,
      CleanerProfile: { isInternalTeam: false },
    });

    const res = await PATCH(patch({ assignedCleanerId: 'cleaner-new' }), {
      params: { jobId: 'job-1' },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('NOT_APPROVED');
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });

  it('accepts an eligible cleaner and an owner price edit', async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 'cleaner-ok',
      email: 'ok@example.test',
      name: 'Eligible Cleaner',
      isActive: true,
      primaryBranchId: 'fictional-vt',
      UserBranch: [{ Branch: { id: 'fictional-vt' } }],
      TrainingStatus: { overallStatus: 'PASSED' },
      CleanerProfile: { isInternalTeam: false },
    });
    mocks.applicationFindFirst.mockResolvedValue({ id: 'app-approved' });

    const assigned = await PATCH(patch({ assignedCleanerId: 'cleaner-ok' }), {
      params: { jobId: 'job-1' },
    });
    expect(assigned.status).toBe(200);
    expect(mocks.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedCleanerId: 'cleaner-ok' }),
      })
    );

    mocks.requireRole.mockResolvedValue({
      userId: 'owner-1',
      role: 'ADMIN',
      isOwner: true,
      isBranchScoped: false,
      branchIds: ['fictional-vt'],
    });
    mocks.jobUpdate.mockClear();
    const priced = await PATCH(patch({ totalPrice: 275 }), { params: { jobId: 'job-1' } });
    expect(priced.status).toBe(200);
    expect(mocks.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 275, quotedTotal: 275 }),
      })
    );
  });
});
