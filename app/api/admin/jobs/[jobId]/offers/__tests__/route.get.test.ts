import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const jobFindUnique = vi.fn();
const offerFindMany = vi.fn();
const logFindFirst = vi.fn();
const logCount = vi.fn();
const assignmentLogFindFirst = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...args: unknown[]) => jobFindUnique(...args) },
    jobOffer: { findMany: (...args: unknown[]) => offerFindMany(...args) },
    integrationEventLog: {
      findFirst: (...args: unknown[]) => logFindFirst(...args),
      count: (...args: unknown[]) => logCount(...args),
    },
    assignmentLog: {
      findFirst: (...args: unknown[]) => assignmentLogFindFirst(...args),
    },
  },
}));

vi.mock('@/lib/dispatch/featureFlags', () => ({
  isDispatchOffersEnabledForBranch: () => true,
}));

import { GET } from '../route';

function getReq() {
  return new NextRequest('http://localhost/api/admin/jobs/job-1/offers');
}

describe('GET /api/admin/jobs/[jobId]/offers notification status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    jobFindUnique.mockResolvedValue({
      id: 'job-1',
      assignedCleanerId: null,
      operationalTotal: 200,
      dispatchUrgency: 'STANDARD',
      estimatedDurationMins: 180,
      preferredDate: new Date('2099-01-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      Branch: { slug: 'vermont' },
      User: null,
    });
    offerFindMany.mockResolvedValue([]);
    logCount.mockResolvedValue(0);
    assignmentLogFindFirst.mockResolvedValue(null);
  });

  it('includes latest SEND_CLEANER_OFFER_EMAIL as Sent', async () => {
    logFindFirst.mockResolvedValue({
      status: 'SUCCESS',
      createdAt: new Date('2026-09-08T13:40:00.000Z'),
    });
    logCount.mockResolvedValue(2);

    const res = await GET(getReq(), { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.offerNotification).toEqual({
      status: 'SENT',
      recordedAt: '2026-09-08T13:40:00.000Z',
      attemptCount: 2,
    });
    expect(json.offerNotification).not.toHaveProperty('errorSummary');
    expect(JSON.stringify(json)).not.toMatch(/api[_-]?key|payload|resend/i);
    expect(logFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: 'job-1', action: 'SEND_CLEANER_OFFER_EMAIL' },
      })
    );
    expect(logCount).toHaveBeenCalledWith({
      where: { jobId: 'job-1', action: 'SEND_CLEANER_OFFER_EMAIL' },
    });
  });

  it('includes Failed when the latest email log failed', async () => {
    logFindFirst.mockResolvedValue({
      status: 'FAILED',
      createdAt: new Date('2026-09-08T13:41:00.000Z'),
    });
    const res = await GET(getReq(), { params: { jobId: 'job-1' } });
    const json = await res.json();
    expect(json.offerNotification.status).toBe('FAILED');
    expect(json.offerNotification.recordedAt).toBe('2026-09-08T13:41:00.000Z');
  });

  it('includes Not recorded when no email log exists', async () => {
    logFindFirst.mockResolvedValue(null);
    const res = await GET(getReq(), { params: { jobId: 'job-1' } });
    const json = await res.json();
    expect(json.offerNotification).toEqual({
      status: 'NOT_RECORDED',
      recordedAt: null,
      attemptCount: 0,
    });
  });

  it('includes service-aware TTL preview for a far-future service date', async () => {
    logFindFirst.mockResolvedValue(null);
    const res = await GET(getReq(), { params: { jobId: 'job-1' } });
    const json = await res.json();
    expect(json.ttl.defaultMinutes).toBe(24 * 60);
    expect(json.ttl.defaultLabel).toMatch(/more than 48 hours/i);
    expect(json.ttl.overrideUsed).toBe(false);
    expect(json.ttl.expiresAt).toBeNull();
  });
});
