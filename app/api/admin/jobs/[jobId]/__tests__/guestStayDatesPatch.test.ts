/**
 * Gate 3 — admin PATCH null/empty semantics for guest stay dates.
 * Lives under app/api so route import is allowed.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  jobFindUnique: vi.fn(),
  jobUpdate: vi.fn(),
  logAuditEntry: vi.fn(),
  awaitJobCalendarSync: vi.fn(),
  awaitJobCalendarCancel: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: mocks.jobFindUnique,
      update: mocks.jobUpdate,
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: (...a: unknown[]) => mocks.awaitJobCalendarSync(...a),
  awaitJobCalendarCancel: (...a: unknown[]) => mocks.awaitJobCalendarCancel(...a),
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
  effectiveOfferStatus: (s: string) => s,
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

describe('Gate 3 admin PATCH null/empty guest stay dates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      userId: 'admin-1',
      role: 'ADMIN',
      branchId: null,
    });
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'branch-vt',
      preferredDate: new Date('2026-10-05T00:00:00.000Z'),
      preferredTime: '10:00',
      guestCheckInDate: new Date('2026-10-01T00:00:00.000Z'),
      guestCheckOutDate: new Date('2026-10-04T00:00:00.000Z'),
      internalNotes: null,
      address: '172 Bear Hill Road',
      serviceType: 'Vacation Rental Turnover',
      status: 'RECEIVED',
      totalPrice: 350,
      quotedTotal: 350,
      amountPaid: 0,
      paymentStatus: 'PENDING',
      assignedCleanerId: null,
      JobPayout: null,
    });
    mocks.jobUpdate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'job-1',
        preferredDate: new Date('2026-10-05T00:00:00.000Z'),
        preferredTime: '10:00',
        guestCheckInDate:
          data.guestCheckInDate === undefined
            ? new Date('2026-10-01T00:00:00.000Z')
            : data.guestCheckInDate,
        guestCheckOutDate:
          data.guestCheckOutDate === undefined
            ? new Date('2026-10-04T00:00:00.000Z')
            : data.guestCheckOutDate,
        internalNotes: null,
        address: '172 Bear Hill Road',
        serviceType: 'Vacation Rental Turnover',
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        balanceDue: null,
        totalPrice: 350,
        assignedCleanerId: null,
      })
    );
    mocks.logAuditEntry.mockResolvedValue('audit-1');
    mocks.awaitJobCalendarSync.mockResolvedValue(undefined);
  });

  it('null clears guestCheckOutDate without touching preferredDate', async () => {
    const req = new NextRequest('http://localhost/api/admin/jobs/job-1', {
      method: 'PATCH',
      body: JSON.stringify({ guestCheckOutDate: null }),
    });
    const res = await PATCH(req, { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    expect(mocks.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guestCheckOutDate: null }),
      })
    );
    const dataArg = mocks.jobUpdate.mock.calls[0][0].data;
    expect(dataArg).not.toHaveProperty('preferredDate');
  });

  it('empty string clears guestCheckInDate', async () => {
    const req = new NextRequest('http://localhost/api/admin/jobs/job-1', {
      method: 'PATCH',
      body: JSON.stringify({ guestCheckInDate: '' }),
    });
    const res = await PATCH(req, { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    expect(mocks.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guestCheckInDate: null }),
      })
    );
  });

  it('YYYY-MM-DD sets UTC midnight checkout', async () => {
    const req = new NextRequest('http://localhost/api/admin/jobs/job-1', {
      method: 'PATCH',
      body: JSON.stringify({ guestCheckOutDate: '2026-10-04' }),
    });
    const res = await PATCH(req, { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    const dataArg = mocks.jobUpdate.mock.calls[0][0].data;
    expect(dataArg.guestCheckOutDate.toISOString()).toBe(
      '2026-10-04T00:00:00.000Z'
    );
  });

  it('omitted guest fields are not written (undefined skip)', async () => {
    const req = new NextRequest('http://localhost/api/admin/jobs/job-1', {
      method: 'PATCH',
      body: JSON.stringify({ preferredTime: '11:00 AM' }),
    });
    const res = await PATCH(req, { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    const dataArg = mocks.jobUpdate.mock.calls[0][0].data;
    expect(dataArg).not.toHaveProperty('guestCheckInDate');
    expect(dataArg).not.toHaveProperty('guestCheckOutDate');
    expect(dataArg.preferredTime).toBe('11:00 AM');
  });

  it('invalid guestCheckOutDate returns 400', async () => {
    const req = new NextRequest('http://localhost/api/admin/jobs/job-1', {
      method: 'PATCH',
      body: JSON.stringify({ guestCheckOutDate: 'bogus' }),
    });
    const res = await PATCH(req, { params: { jobId: 'job-1' } });
    expect(res.status).toBe(400);
    expect(mocks.jobUpdate).not.toHaveBeenCalled();
  });
});
