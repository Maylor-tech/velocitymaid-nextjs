import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  logAuditEntry: vi.fn(),
  maybeCreatePayoutAfterTransition: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...a: unknown[]) => mocks.findUnique(...a),
      update: (...a: unknown[]) => mocks.update(...a),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

vi.mock('@/lib/booking/maybeCreatePayoutAfterTransition', () => ({
  maybeCreatePayoutAfterTransition: (...a: unknown[]) =>
    mocks.maybeCreatePayoutAfterTransition(...a),
}));

import { POST } from '@/app/api/admin/jobs/[jobId]/mark-paid/route';

function req(body: unknown) {
  return new NextRequest('http://localhost/api/admin/jobs/job-1/mark-paid', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/jobs/[jobId]/mark-paid (Phase 7B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.logAuditEntry.mockResolvedValue(undefined);
    mocks.maybeCreatePayoutAfterTransition.mockResolvedValue({
      ok: true,
      reason: 'CREATED',
      payoutId: 'payout-1',
    });
    mocks.update.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      amountPaid: 240,
      balanceDue: 0,
      paymentMethod: 'Cash',
      paymentReference: 'ref-1',
      paidAt: new Date('2026-04-01T12:00:00Z'),
      currency: 'USD',
    });
  });

  it('completed + admin mark-paid -> payout evaluated once', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      paymentStatus: 'BALANCE_DUE',
      status: 'COMPLETED',
      currency: 'USD',
    });

    const res = await POST(req({ amount: 240, method: 'Cash', reference: 'ref-1' }), {
      params: { jobId: 'job-1' },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.maybeCreatePayoutAfterTransition).toHaveBeenCalledWith('job-1');
    expect(mocks.maybeCreatePayoutAfterTransition).toHaveBeenCalledTimes(1);
    expect(json.payout).toEqual({
      ok: true,
      reason: 'CREATED',
      payoutId: 'payout-1',
    });
    expect(mocks.logAuditEntry).toHaveBeenCalled();
  });

  it('incomplete + admin mark-paid -> payout evaluate returns NOT_COMPLETED', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      paymentStatus: 'PENDING',
      status: 'ASSIGNED',
      currency: 'USD',
    });
    mocks.update.mockResolvedValue({
      id: 'job-1',
      status: 'ASSIGNED',
      paymentStatus: 'PAID',
      amountPaid: 265,
      balanceDue: 0,
      paymentMethod: 'PayPal',
      paymentReference: null,
      paidAt: new Date(),
      currency: 'USD',
    });
    mocks.maybeCreatePayoutAfterTransition.mockResolvedValue({
      ok: false,
      reason: 'NOT_COMPLETED',
    });

    const res = await POST(req({ amount: 265, method: 'PayPal' }), {
      params: { jobId: 'job-1' },
    });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.payout).toEqual({ ok: false, reason: 'NOT_COMPLETED' });
    expect(mocks.maybeCreatePayoutAfterTransition).toHaveBeenCalledTimes(1);
  });

  it('repeated mark-paid blocked; no second payout create path', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      currency: 'USD',
    });

    const res = await POST(req({ amount: 100, method: 'Cash' }), {
      params: { jobId: 'job-1' },
    });
    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.maybeCreatePayoutAfterTransition).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated callers', async () => {
    mocks.requireRole.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await POST(req({ amount: 100, method: 'Cash' }), {
      params: { jobId: 'job-1' },
    });
    expect(res.status).toBe(401);
  });
});
