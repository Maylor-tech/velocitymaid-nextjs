/**
 * POST /api/admin/jobs/[jobId]/team-compensation/pay
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const jobFindUnique = vi.fn();
const compensationFindUnique = vi.fn();
const compensationUpdate = vi.fn();
const jobPayoutUpdate = vi.fn();
const invoiceUpdate = vi.fn();
const jobUpdate = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => jobFindUnique(...args),
      update: (...args: unknown[]) => jobUpdate(...args),
    },
    jobTeamCompensation: {
      findUnique: (...args: unknown[]) => compensationFindUnique(...args),
      update: (...args: unknown[]) => compensationUpdate(...args),
    },
    jobPayout: { update: (...args: unknown[]) => jobPayoutUpdate(...args) },
    invoice: { update: (...args: unknown[]) => invoiceUpdate(...args) },
  },
}));

import { POST } from '../route';

const JOB_ID = 'job-complete-1';
const BRIAN = 'brian-id';
const DORI = 'dori-id';
const PAID_AT = '2026-10-02T12:00:00.000Z';

const owedRow = {
  id: 'comp-1',
  jobId: JOB_ID,
  cleanerId: DORI,
  branchId: 'branch-vt',
  amountCents: 10000,
  currency: 'USD',
  status: 'OWED',
  paymentMethod: null,
  paidAt: null,
  paymentRef: null,
  note: null,
};

function jobRow() {
  return {
    id: JOB_ID,
    branchId: 'branch-vt',
    assignedCleanerId: BRIAN,
    paymentStatus: 'PAID',
    JobTeamMember: [
      { cleanerId: BRIAN, sortOrder: 0 },
      { cleanerId: DORI, sortOrder: 1 },
    ],
    JobPayout: {
      id: 'payout-brian',
      cleanerId: BRIAN,
      status: 'READY',
      paidAt: null,
    },
  };
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/admin/jobs/${JOB_ID}/team-compensation/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const payBody = {
  cleanerId: DORI,
  amountCents: 10000,
  paymentMethod: 'ZELLE',
  paidAt: PAID_AT,
  paymentRef: 'zelle-dori-100',
  confirm: true,
};

describe('POST /api/admin/jobs/[jobId]/team-compensation/pay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    jobFindUnique.mockResolvedValue(jobRow());
    compensationFindUnique.mockResolvedValue({ ...owedRow });
    compensationUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...owedRow,
      ...data,
    }));
  });

  it('records a Zelle payment and leaves JobPayout / primary / customer payment untouched', async () => {
    const res = await POST(postRequest(payBody), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.compensation.status).toBe('PAID');
    expect(json.compensation.paymentMethod).toBe('ZELLE');
    expect(json.compensation.paymentRef).toBe('zelle-dori-100');
    expect(json.summary).toMatch(/Paid \$100\.00 via Zelle/);
    expect(json.jobPayout).toEqual({
      id: 'payout-brian',
      cleanerId: BRIAN,
      status: 'READY',
      paidAt: null,
    });
    expect(json.jobPaymentStatus).toBe('PAID');
    expect(json.primaryCleanerId).toBe(BRIAN);
    expect(jobPayoutUpdate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('requires explicit confirmation before OWED → PAID', async () => {
    const res = await POST(postRequest({ ...payBody, confirm: false }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('CONFIRM_REQUIRED');
    expect(compensationUpdate).not.toHaveBeenCalled();
  });

  it('is idempotent for the same paid metadata', async () => {
    compensationFindUnique.mockResolvedValue({
      ...owedRow,
      status: 'PAID',
      paymentMethod: 'ZELLE',
      paidAt: new Date(PAID_AT),
      paymentRef: 'zelle-dori-100',
    });
    const res = await POST(postRequest(payBody), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
    expect((await res.json()).idempotent).toBe(true);
    expect(compensationUpdate).not.toHaveBeenCalled();
  });

  it('rejects a duplicate payment with different amount', async () => {
    compensationFindUnique.mockResolvedValue({
      ...owedRow,
      status: 'PAID',
      paymentMethod: 'ZELLE',
      paidAt: new Date(PAID_AT),
      paymentRef: 'zelle-dori-100',
    });
    const res = await POST(postRequest({ ...payBody, amountCents: 5000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ALREADY_PAID');
  });

  it('can record payment after the assistant is removed from the current team', async () => {
    jobFindUnique.mockResolvedValue({
      ...jobRow(),
      JobTeamMember: [{ cleanerId: BRIAN, sortOrder: 0 }],
    });
    const res = await POST(postRequest(payBody), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
    expect((await res.json()).compensation.status).toBe('PAID');
    expect(compensationUpdate).toHaveBeenCalled();
  });

  it('enforces branch isolation', async () => {
    requireRole.mockResolvedValue({
      userId: 'admin-nj',
      role: 'ADMIN',
      branchId: 'branch-nj',
    });
    const res = await POST(postRequest(payBody), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(404);
    expect(compensationUpdate).not.toHaveBeenCalled();
  });

  it('blocks unauthorized access', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await POST(postRequest(payBody), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(401);
  });
});
