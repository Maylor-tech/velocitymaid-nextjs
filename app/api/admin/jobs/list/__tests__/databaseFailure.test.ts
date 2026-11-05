import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  jobFindMany: vi.fn(),
  jobCount: vi.fn(),
  auditFindMany: vi.fn(),
  invoiceAggregate: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({ requireRole: mocks.auth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findMany: mocks.jobFindMany, count: mocks.jobCount },
    auditLog: { findMany: mocks.auditFindMany },
    invoice: { aggregate: mocks.invoiceAggregate },
    branch: { findMany: vi.fn() },
  },
}));

import { GET } from '../route';

const request = () => new NextRequest('https://preview.example.test/api/admin/jobs/list?board=today');
const owner = {
  userId: 'user-staging-admin',
  role: 'ADMIN',
  isOwner: true,
  isBranchScoped: false,
  branchIds: ['branch-staging-nj', 'branch-staging-vermont'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(owner);
});

describe('admin jobs list database results', () => {
  it('returns a sanitized non-success response when SELECT on Job is denied', async () => {
    mocks.jobFindMany.mockRejectedValue(Object.assign(
      new Error('permission denied for table Job postgresql://fictional:FICTIONAL_SECRET@db.invalid/postgres'),
      { code: '42501' },
    ));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Failed to list jobs' });
    expect(JSON.stringify(body)).not.toContain('FICTIONAL_SECRET');
    expect(JSON.stringify(body)).not.toContain('postgresql://');
    expect(mocks.jobCount).not.toHaveBeenCalled();
  });

  it('keeps a successful empty list as an empty result with confirmed zero counts', async () => {
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.auditFindMany.mockResolvedValue([]);
    mocks.invoiceAggregate.mockResolvedValue({ _sum: { balanceDue: null }, _count: 0 });
    mocks.jobCount.mockResolvedValue(0);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.jobs).toEqual([]);
    expect(body.boardCounts).toEqual({
      inbox: 0,
      today: 0,
      upcoming: 0,
      completed: 0,
      exceptions: 0,
    });
    expect(body.warning).toBeUndefined();
    expect(body.error).toBeUndefined();
  });

  it('preserves an authorization response instead of treating it as a database failure', async () => {
    const denied = NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    mocks.auth.mockRejectedValue(denied);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ success: false, error: 'Forbidden' });
    expect(mocks.jobFindMany).not.toHaveBeenCalled();
  });
});
