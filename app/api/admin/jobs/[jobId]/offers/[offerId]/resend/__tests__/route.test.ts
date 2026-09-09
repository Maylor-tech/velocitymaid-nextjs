import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { DispatchError } from '@/lib/dispatch/errors';

const requireRole = vi.fn();
const resendOfferNotification = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

vi.mock('@/lib/dispatch/resendOfferNotification', () => ({
  resendOfferNotification: (...args: unknown[]) => resendOfferNotification(...args),
}));

import { POST } from '../route';

function postReq() {
  return new NextRequest('http://localhost/api/admin/jobs/job-1/offers/offer-1/resend', {
    method: 'POST',
  });
}

describe('POST /api/admin/jobs/[jobId]/offers/[offerId]/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    resendOfferNotification.mockResolvedValue({
      offer: {
        id: 'offer-1',
        cleanerId: 'cleaner-1',
        compensationAmount: 180,
        compensationBasis: 'FLAT',
        offeredAt: new Date('2026-09-08T12:00:00.000Z'),
        expiresAt: new Date('2099-01-15T16:00:00.000Z'),
      },
      notification: { sent: true },
    });
  });

  it('rejects non-admin callers', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const res = await POST(postReq(), { params: { jobId: 'job-1', offerId: 'offer-1' } });
    expect(res.status).toBe(401);
    expect(resendOfferNotification).not.toHaveBeenCalled();
  });

  it('returns the unchanged offer after a successful resend', async () => {
    const res = await POST(postReq(), { params: { jobId: 'job-1', offerId: 'offer-1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.offer).toEqual({
      id: 'offer-1',
      cleanerId: 'cleaner-1',
      compensationAmount: 180,
      compensationBasis: 'FLAT',
      offeredAt: '2026-09-08T12:00:00.000Z',
      expiresAt: '2099-01-15T16:00:00.000Z',
    });
    expect(json.notification.sent).toBe(true);
    expect(resendOfferNotification).toHaveBeenCalledWith({
      jobId: 'job-1',
      offerId: 'offer-1',
      adminId: 'admin-1',
    });
  });

  it('maps expired rejection to 409 OFFER_EXPIRED', async () => {
    resendOfferNotification.mockRejectedValue(
      new DispatchError('This offer has expired', 'OFFER_EXPIRED', 409)
    );
    const res = await POST(postReq(), { params: { jobId: 'job-1', offerId: 'offer-1' } });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json).toMatchObject({ success: false, code: 'OFFER_EXPIRED' });
  });
});
