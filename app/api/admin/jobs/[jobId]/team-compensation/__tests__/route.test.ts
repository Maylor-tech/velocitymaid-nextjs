/**
 * PUT/GET /api/admin/jobs/[jobId]/team-compensation
 * Assistant ledger only — never mutates JobPayout, invoice, or primary cleaner.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const jobFindUnique = vi.fn();
const compensationFindUnique = vi.fn();
const compensationFindMany = vi.fn();
const compensationCreate = vi.fn();
const compensationUpdate = vi.fn();
const jobPayoutUpdate = vi.fn();
const invoiceUpdate = vi.fn();
const jobUpdate = vi.fn();
const invoicePaymentCreate = vi.fn();

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
      findMany: (...args: unknown[]) => compensationFindMany(...args),
      create: (...args: unknown[]) => compensationCreate(...args),
      update: (...args: unknown[]) => compensationUpdate(...args),
    },
    jobPayout: { update: (...args: unknown[]) => jobPayoutUpdate(...args) },
    invoice: { update: (...args: unknown[]) => invoiceUpdate(...args) },
    invoicePayment: { create: (...args: unknown[]) => invoicePaymentCreate(...args) },
  },
}));

import { GET, PUT } from '../route';

const JOB_ID = 'job-complete-1';
const BRIAN = 'brian-id';
const DORI = 'dori-id';
const STRANGER = 'stranger-id';

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
    JobPayout: { id: 'payout-brian', cleanerId: BRIAN, status: 'READY' },
  };
}

function putRequest(body: unknown, jobId = JOB_ID): NextRequest {
  return new NextRequest(`http://localhost/api/admin/jobs/${jobId}/team-compensation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET/PUT /api/admin/jobs/[jobId]/team-compensation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    jobFindUnique.mockResolvedValue(jobRow());
    compensationFindMany.mockResolvedValue([]);
    compensationFindUnique.mockResolvedValue(null);
    compensationCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'comp-1',
      paymentMethod: null,
      paidAt: null,
      paymentRef: null,
      note: null,
      currency: 'USD',
      status: 'OWED',
      ...data,
    }));
  });

  it('creates assistant compensation as OWED without marking paid', async () => {
    const res = await PUT(putRequest({ cleanerId: DORI, amountCents: 10000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.compensation.status).toBe('OWED');
    expect(json.compensation.amountCents).toBe(10000);
    expect(json.compensation.amountUsd).toBe(100);
    expect(json.jobPayoutId).toBe('payout-brian');
    expect(json.jobPaymentStatus).toBe('PAID');
    expect(json.primaryCleanerId).toBe(BRIAN);
    expect(compensationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobId: JOB_ID,
          cleanerId: DORI,
          amountCents: 10000,
          status: 'OWED',
        }),
      })
    );
    expect(jobPayoutUpdate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('parses dollar strings to integer cents', async () => {
    await PUT(putRequest({ cleanerId: DORI, amountDollars: '100.00' }), {
      params: { jobId: JOB_ID },
    });
    expect(compensationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 10000 }),
      })
    );
  });

  it('does not allow the primary cleaner', async () => {
    const res = await PUT(putRequest({ cleanerId: BRIAN, amountCents: 10000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('PRIMARY_CLEANER');
    expect(compensationCreate).not.toHaveBeenCalled();
  });

  it('rejects an unrelated cleaner', async () => {
    const res = await PUT(putRequest({ cleanerId: STRANGER, amountCents: 10000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('NOT_ON_TEAM');
    expect(compensationCreate).not.toHaveBeenCalled();
  });

  it('branch-scoped admin cannot see another branch job', async () => {
    requireRole.mockResolvedValue({
      userId: 'admin-nj',
      role: 'ADMIN',
      branchId: 'branch-nj',
    });
    const res = await PUT(putRequest({ cleanerId: DORI, amountCents: 10000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(404);
    expect(compensationCreate).not.toHaveBeenCalled();
  });

  it('blocks unauthorized access', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(new NextRequest(`http://localhost/api/admin/jobs/${JOB_ID}/team-compensation`), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(401);
  });

  it('rejects editing a paid historical record', async () => {
    compensationFindUnique.mockResolvedValue({
      id: 'comp-1',
      jobId: JOB_ID,
      cleanerId: DORI,
      branchId: 'branch-vt',
      amountCents: 10000,
      currency: 'USD',
      status: 'PAID',
      paymentMethod: 'ZELLE',
      paidAt: new Date('2026-10-02T12:00:00.000Z'),
      paymentRef: 'zelle-1',
      note: null,
    });
    const res = await PUT(putRequest({ cleanerId: DORI, amountCents: 12000 }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(409);
    expect(compensationUpdate).not.toHaveBeenCalled();
  });
});
