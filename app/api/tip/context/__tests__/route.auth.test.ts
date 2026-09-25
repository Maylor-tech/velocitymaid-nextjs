import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';

const requireRole = vi.fn();
const getCustomerSession = vi.fn();
const jobFindUnique = vi.fn();
const userFindFirst = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => userFindFirst(...a) },
    // Required by resolveTipServiceEarner team-boundary checks (P0-C+).
    // Incomplete mocks caused 500 on main + this branch (not NJ-related).
    jobTeamMember: { findMany: vi.fn().mockResolvedValue([]) },
    jobOffer: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { GET } from '@/app/api/tip/context/route';

function contextRequest(jobId?: string) {
  const url = jobId
    ? `http://localhost/api/tip/context?jobId=${encodeURIComponent(jobId)}`
    : 'http://localhost/api/tip/context';
  return new NextRequest(url);
}

describe('GET /api/tip/context authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json(
        { success: false, error: 'Unauthorized: Customer authentication required' },
        { status: 401 }
      )
    );

    const res = await GET(contextRequest('job-1'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when jobId and grant missing', async () => {
    requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'host@example.com',
    });

    const res = await GET(contextRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  it('returns 404 for another customer completed job (fail closed)', async () => {
    requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'host@example.com',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-other',
      customerId: 'cust-other',
    });

    const res = await GET(contextRequest('job-other'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('JOB_NOT_FOUND');
    expect(body).not.toHaveProperty('context');
  });

  it('returns 404 for invalid / missing job id', async () => {
    requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'host@example.com',
    });
    jobFindUnique.mockResolvedValueOnce(null);

    const res = await GET(contextRequest('missing-job'));
    expect(res.status).toBe(404);
  });

  it('returns 409 for own incomplete / ineligible job', async () => {
    requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'host@example.com',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      customerId: 'cust-1',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: JobStatus.ASSIGNED,
      assignedCleanerId: 'cleaner-1',
      propertyId: null,
      branchId: 'b1',
      marketLabel: null,
      completedAt: null,
    });

    const res = await GET(contextRequest('job-1'));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('JOB_NOT_COMPLETED');
  });

  it('returns 200 display context for own completed eligible job without jobId field', async () => {
    requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'host@example.com',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      customerId: 'cust-1',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'p1',
      branchId: 'b1',
      marketLabel: 'vermont',
      completedAt: new Date(),
    });
    userFindFirst.mockResolvedValue({ id: 'cleaner-1' });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      serviceType: 'Turnover',
      preferredDate: new Date('2026-09-15T12:00:00.000Z'),
      address: '123 Main St',
      jobReference: 'VM-2026-0040',
      Property: { name: 'Maple Cabin', address: '123 Main St' },
    });

    const res = await GET(contextRequest('job-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.context.propertyLabel).toBe('Maple Cabin');
    expect(body.context.serviceType).toBe('Turnover');
    expect(body.context.jobReference).toBe('VM-2026-0040');
    expect(body.context.serviceDate).toBeTruthy();
    expect(body.context.eligible).toBe(true);
    expect(body.context).not.toHaveProperty('jobId');
    expect(JSON.stringify(body)).not.toMatch(/"jobId"/);
  });
});
