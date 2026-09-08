import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const acceptJobOffer = vi.fn();
const declineJobOffer = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/dispatch/jobOffer', () => ({
  acceptJobOffer: (...args: unknown[]) => acceptJobOffer(...args),
  declineJobOffer: (...args: unknown[]) => declineJobOffer(...args),
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

import { POST as POST_ACCEPT } from '@/app/api/cleaner/offers/[offerId]/accept/route';
import { POST as POST_DECLINE } from '@/app/api/cleaner/offers/[offerId]/decline/route';

const OFFER_ID = 'offer-live-1';
const USER_ID = 'user-dorottya';

function post(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('cleaner offer respond with phone-login session (User.id)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: USER_ID, role: 'CLEANER' });
  });

  it('accept uses the resolved User.id', async () => {
    acceptJobOffer.mockResolvedValue({
      jobId: 'job-1',
      offerId: OFFER_ID,
      paymentStatus: 'PENDING',
    });
    const res = await POST_ACCEPT(post(`http://localhost/api/cleaner/offers/${OFFER_ID}/accept`), {
      params: { offerId: OFFER_ID },
    });
    expect(res.status).toBe(200);
    expect(acceptJobOffer).toHaveBeenCalledWith({
      offerId: OFFER_ID,
      cleanerId: USER_ID,
    });
  });

  it('decline uses the resolved User.id', async () => {
    declineJobOffer.mockResolvedValue({ jobId: 'job-1' });
    const res = await POST_DECLINE(
      post(`http://localhost/api/cleaner/offers/${OFFER_ID}/decline`, { reason: 'conflict' }),
      { params: { offerId: OFFER_ID } }
    );
    expect(res.status).toBe(200);
    expect(declineJobOffer).toHaveBeenCalledWith({
      offerId: OFFER_ID,
      cleanerId: USER_ID,
      reason: 'conflict',
    });
  });
});
