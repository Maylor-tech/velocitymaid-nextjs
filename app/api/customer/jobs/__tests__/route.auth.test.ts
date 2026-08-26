/**
 * Unauthenticated GET /api/customer/jobs must return 401, not 500.
 * requireRole throws a NextResponse/Response; the route catch must return it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const getCustomerSession = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { job: { findMany: vi.fn() } },
}));

vi.mock('@/lib/cleaners/internalCleanerService', () => ({
  loadJobTeamBatch: vi.fn(),
}));

vi.mock('@/lib/customer/customerJobList', () => ({
  customerJobListWhere: vi.fn(),
}));

import { GET } from '@/app/api/customer/jobs/route';

function jobsRequest() {
  return new NextRequest('http://localhost/api/customer/jobs');
}

describe('GET /api/customer/jobs unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCustomerSession.mockResolvedValue(null);
  });

  it('returns 401 when requireRole throws NextResponse', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json(
        { success: false, error: 'Unauthorized: Customer authentication required' },
        { status: 401 }
      )
    );

    const res = await GET(jobsRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it('returns 401 when requireRole throws a plain Response (Vercel/bundled class identity)', async () => {
    requireRole.mockRejectedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Customer authentication required',
        }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    );

    const res = await GET(jobsRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/i);
  });
});
