import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';

const requireCleanerJobAssignment = vi.fn();
const getAuthenticatedCleaner = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const logAuditEntry = vi.fn();
const createAdminNotification = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireCleanerJobAssignment: (...args: unknown[]) =>
    requireCleanerJobAssignment(...args),
}));

vi.mock('@/lib/cleanerAuth', () => ({
  getAuthenticatedCleaner: (...args: unknown[]) => getAuthenticatedCleaner(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => logAuditEntry(...args),
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...args: unknown[]) => createAdminNotification(...args),
  adminNotificationHelpers: { adminJobLink: (id: string) => `/admin/jobs/${id}` },
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

import { PATCH } from '@/app/api/cleaner/jobs/[jobId]/complete/route';

const JOB_ID = 'job-1';
const CLEANER_ID = 'cleaner-1';

describe('PATCH /api/cleaner/jobs/[jobId]/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCleanerJobAssignment.mockResolvedValue({ userId: CLEANER_ID });
    getAuthenticatedCleaner.mockResolvedValue({
      success: true,
      cleanerId: CLEANER_ID,
    });
    createAdminNotification.mockResolvedValue({ ok: true });
    logAuditEntry.mockResolvedValue(undefined);
  });

  it('sets AWAITING_QC and does not mark COMPLETED or set completedAt', async () => {
    findUnique.mockResolvedValue({
      id: JOB_ID,
      status: JobStatus.IN_PROGRESS,
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      assignedCleanerId: CLEANER_ID,
      startedAt: new Date('2026-08-28T12:00:00.000Z'),
      completedAt: null,
      submittedForQcAt: null,
      cleanDurationMins: null,
      jobReference: 'VM-TEST-1',
    });
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: JOB_ID,
      status: data.status,
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      completedAt: data.completedAt ?? null,
      submittedForQcAt: data.submittedForQcAt ?? null,
      startedAt: new Date('2026-08-28T12:00:00.000Z'),
      cleanDurationMins: data.cleanDurationMins ?? 90,
    }));

    const res = await PATCH(
      new NextRequest(`http://localhost/api/cleaner/jobs/${JOB_ID}/complete`, {
        method: 'PATCH',
      }),
      { params: { jobId: JOB_ID } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.submittedForQc).toBe(true);
    expect(json.job.status).toBe(JobStatus.AWAITING_QC);
    expect(json.job.status).not.toBe(JobStatus.COMPLETED);
    expect(json.job.completedAt).toBeNull();
    expect(json.job.paymentStatus).toBe('PENDING');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: JobStatus.AWAITING_QC,
        }),
      })
    );
    const updateData = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(updateData).not.toHaveProperty('completedAt');
  });
});
