import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { DispatchError } from '@/lib/dispatch/errors';

const requireRole = vi.fn();
const releaseAssignedCleaner = vi.fn();
const canMutateDispatchOffers = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

vi.mock('@/lib/dispatch/environmentSafety', () => ({
  canMutateDispatchOffers: (...args: unknown[]) => canMutateDispatchOffers(...args),
  dispatchMutationBlockReason: () => 'staging blocked',
}));

vi.mock('@/lib/dispatch/releaseAssignment', () => ({
  releaseAssignedCleaner: (...args: unknown[]) => releaseAssignedCleaner(...args),
}));

import { POST } from '../route';

function postReq(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/jobs/job-oct4/release-cleaner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/jobs/[jobId]/release-cleaner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    canMutateDispatchOffers.mockReturnValue(true);
    releaseAssignedCleaner.mockResolvedValue({
      job: {
        id: 'job-oct4',
        status: 'CONFIRMED',
        assignedCleanerId: null,
        paymentStatus: 'PENDING',
        quotedTotal: 265,
        totalPrice: 265,
        operationalTotal: 200,
      },
      offer: {
        id: 'offer-accepted-1',
        status: 'ACCEPTED',
        cleanerId: 'user-dorottya',
        compensationAmount: 172.25,
        compensationBasis: 'FLAT',
        offeredAt: new Date('2026-09-08T14:02:42.691Z'),
        expiresAt: new Date('2026-09-08T16:02:42.691Z'),
      },
      release: { reason: 'CLEANER_UNAVAILABLE', notes: null },
    });
  });

  it('rejects non-admin callers', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await POST(postReq({ reason: 'CLEANER_UNAVAILABLE' }), {
      params: { jobId: 'job-oct4' },
    });
    expect(res.status).toBe(401);
    expect(releaseAssignedCleaner).not.toHaveBeenCalled();
  });

  it('releases and returns preserved offer terms', async () => {
    const res = await POST(
      postReq({
        expectedCleanerId: 'user-dorottya',
        reason: 'CLEANER_UNAVAILABLE',
      }),
      { params: { jobId: 'job-oct4' } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.job.assignedCleanerId).toBeNull();
    expect(json.offer.status).toBe('ACCEPTED');
    expect(json.offer.compensationAmount).toBe(172.25);
  });

  it('maps completed-job rejection to 409', async () => {
    releaseAssignedCleaner.mockRejectedValue(
      new DispatchError('Completed jobs cannot be released', 'JOB_COMPLETED', 409)
    );
    const res = await POST(postReq({ reason: 'ADMIN_CORRECTION' }), {
      params: { jobId: 'job-oct4' },
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('JOB_COMPLETED');
  });
});
