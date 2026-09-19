import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { JobStatus } from '@prisma/client';

const requireRole = vi.fn();
const applyAdminTerminalCancellation = vi.fn();
const awaitJobCalendarCancel = vi.fn();
const notifyCleanerOfJobCancellation = vi.fn();
const sendEmergencyCancelNoticeForJob = vi.fn();
const refundDepositForRejectedJob = vi.fn();
const logAuditEntry = vi.fn();
const jobFindUnique = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/admin/applyAdminTerminalCancellation', () => ({
  applyAdminTerminalCancellation: (...a: unknown[]) =>
    applyAdminTerminalCancellation(...a),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarCancel: (...a: unknown[]) => awaitJobCalendarCancel(...a),
  awaitJobCalendarSync: vi.fn(),
}));

vi.mock('@/lib/notifications/cleanerCancellationEmail', () => ({
  notifyCleanerOfJobCancellation: (...a: unknown[]) =>
    notifyCleanerOfJobCancellation(...a),
}));

vi.mock('@/lib/notifications/emergencyCancelNotice', () => ({
  sendEmergencyCancelNoticeForJob: (...a: unknown[]) =>
    sendEmergencyCancelNoticeForJob(...a),
}));

vi.mock('@/lib/booking/depositRefund', () => ({
  refundDepositForRejectedJob: (...a: unknown[]) =>
    refundDepositForRejectedJob(...a),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
  },
}));

import { POST as emergencyCancel } from '../emergency-cancel/route';
import { POST as rejectBooking } from '../reject/route';
import { PATCH as patchJob } from '../route';

function cancelResult(overrides: Record<string, unknown> = {}) {
  return {
    job: {
      id: 'job-oct4',
      status: JobStatus.CANCELLED,
      assignedCleanerId: null,
      assignedAt: null,
      paymentStatus: 'DEPOSIT_PAID',
      quotedTotal: 265,
      totalPrice: 265,
      cancellationReason: 'Rejected',
      cancelledAt: new Date(),
    },
    releasedCleanerId: 'user-dorottya',
    cancelledOpenOfferCount: 1,
    acceptedOffer: {
      id: 'offer-accepted-1',
      status: 'ACCEPTED',
      compensationAmount: 172.25,
      compensationBasis: 'FLAT',
    },
    ...overrides,
  };
}

describe('admin cancellation routes — assignment integrity + notify order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({
      userId: 'admin-1',
      role: 'ADMIN',
      branchId: null,
    });
    awaitJobCalendarCancel.mockResolvedValue(undefined);
    notifyCleanerOfJobCancellation.mockResolvedValue({ sent: true });
    sendEmergencyCancelNoticeForJob.mockResolvedValue(true);
    refundDepositForRejectedJob.mockResolvedValue({ status: 'refunded' });
    logAuditEntry.mockResolvedValue(undefined);
    applyAdminTerminalCancellation.mockResolvedValue(cancelResult());
  });

  it('emergency-cancel uses pre-clear cleaner id and keeps cancel if notify fails', async () => {
    applyAdminTerminalCancellation.mockResolvedValue(
      cancelResult({
        job: {
          id: 'job-oct4',
          status: JobStatus.CANCELLED_EMERGENCY,
          assignedCleanerId: null,
          assignedAt: null,
          paymentStatus: 'PENDING',
          quotedTotal: 265,
          totalPrice: 265,
          cancellationReason: 'Emergency cancellation',
          cancelledAt: new Date(),
        },
      })
    );
    notifyCleanerOfJobCancellation.mockRejectedValue(new Error('resend down'));

    const res = await emergencyCancel(
      new NextRequest('http://localhost/api/admin/jobs/job-oct4/emergency-cancel', {
        method: 'POST',
      }),
      { params: { jobId: 'job-oct4' } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.assignedCleanerId).toBeNull();
    expect(json.releasedCleanerId).toBe('user-dorottya');

    expect(applyAdminTerminalCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-oct4',
        nextStatus: JobStatus.CANCELLED_EMERGENCY,
        reasonCode: 'EMERGENCY',
        blockCompleted: true,
      })
    );
    expect(awaitJobCalendarCancel).toHaveBeenCalledWith('job-oct4');
    expect(notifyCleanerOfJobCancellation).toHaveBeenCalledWith({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
      triggeredBy: 'admin',
    });
    expect(sendEmergencyCancelNoticeForJob).toHaveBeenCalledWith('job-oct4');
  });

  it('reject cancels+clears before refund and notifies released cleaner', async () => {
    jobFindUnique
      .mockResolvedValueOnce({
        id: 'job-oct4',
        paymentStatus: 'DEPOSIT_PAID',
        assignedCleanerId: 'user-dorottya',
        status: JobStatus.ASSIGNED,
      })
      .mockResolvedValueOnce({
        id: 'job-oct4',
        status: JobStatus.CANCELLED,
        assignedCleanerId: null,
        assignedAt: null,
        paymentStatus: 'REFUNDED',
      });

    const res = await rejectBooking(
      new NextRequest('http://localhost/api/admin/jobs/job-oct4/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Duplicate booking' }),
      }),
      { params: { jobId: 'job-oct4' } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.job.assignedCleanerId).toBeNull();
    expect(json.refund.status).toBe('refunded');

    expect(applyAdminTerminalCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-oct4',
        nextStatus: JobStatus.CANCELLED,
        reasonCode: 'ADMIN_REJECTED',
      })
    );

    const cancelOrder = applyAdminTerminalCancellation.mock.invocationCallOrder[0];
    const refundOrder = refundDepositForRejectedJob.mock.invocationCallOrder[0];
    const notifyOrder = notifyCleanerOfJobCancellation.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(refundOrder);
    expect(refundOrder).toBeLessThan(notifyOrder);

    expect(notifyCleanerOfJobCancellation).toHaveBeenCalledWith({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
      triggeredBy: 'admin',
    });
  });

  it('PATCH ASSIGNED → CANCELLED clears via shared helper and notifies', async () => {
    jobFindUnique
      .mockResolvedValueOnce({
        id: 'job-oct4',
        branchId: 'branch-vt',
        preferredDate: new Date('2026-10-04T14:00:00.000Z'),
        preferredTime: '10:00 AM',
        internalNotes: null,
        address: null,
        serviceType: 'Turnover clean',
        status: JobStatus.ASSIGNED,
        totalPrice: 265,
        quotedTotal: 265,
        amountPaid: 0,
        paymentStatus: 'PENDING',
        assignedCleanerId: 'user-dorottya',
        JobPayout: null,
      })
      .mockResolvedValueOnce({
        id: 'job-oct4',
        preferredDate: new Date('2026-10-04T14:00:00.000Z'),
        preferredTime: '10:00 AM',
        internalNotes: null,
        address: null,
        serviceType: 'Turnover clean',
        status: JobStatus.CANCELLED,
        paymentStatus: 'PENDING',
        balanceDue: null,
        totalPrice: 265,
        assignedCleanerId: null,
        assignedAt: null,
      });

    const res = await patchJob(
      new NextRequest('http://localhost/api/admin/jobs/job-oct4', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      { params: { jobId: 'job-oct4' } }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.job.status).toBe(JobStatus.CANCELLED);
    expect(json.job.assignedCleanerId).toBeNull();

    expect(applyAdminTerminalCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-oct4',
        nextStatus: JobStatus.CANCELLED,
        reasonCode: 'ADMIN_CANCELLED',
      })
    );
    expect(notifyCleanerOfJobCancellation).toHaveBeenCalledWith({
      jobId: 'job-oct4',
      cleanerId: 'user-dorottya',
      triggeredBy: 'admin',
    });
  });

  it('PATCH unassigned cancel still works without cleaner notify', async () => {
    applyAdminTerminalCancellation.mockResolvedValue(
      cancelResult({
        releasedCleanerId: null,
        acceptedOffer: null,
        cancelledOpenOfferCount: 0,
      })
    );
    jobFindUnique
      .mockResolvedValueOnce({
        id: 'job-oct4',
        branchId: 'branch-vt',
        preferredDate: null,
        preferredTime: null,
        internalNotes: null,
        address: null,
        serviceType: 'Standard clean',
        status: JobStatus.CONFIRMED,
        totalPrice: 200,
        quotedTotal: 200,
        amountPaid: 0,
        paymentStatus: 'PENDING',
        assignedCleanerId: null,
        JobPayout: null,
      })
      .mockResolvedValueOnce({
        id: 'job-oct4',
        preferredDate: null,
        preferredTime: null,
        internalNotes: null,
        address: null,
        serviceType: 'Standard clean',
        status: JobStatus.CANCELLED,
        paymentStatus: 'PENDING',
        balanceDue: null,
        totalPrice: 200,
        assignedCleanerId: null,
        assignedAt: null,
      });

    const res = await patchJob(
      new NextRequest('http://localhost/api/admin/jobs/job-oct4', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      { params: { jobId: 'job-oct4' } }
    );

    expect(res.status).toBe(200);
    expect(applyAdminTerminalCancellation).toHaveBeenCalled();
    expect(notifyCleanerOfJobCancellation).not.toHaveBeenCalled();
  });
});
