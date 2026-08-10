/**
 * Auth + response shape for Integration Health GET.
 * Must not call Google APIs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const getIntegrationHealthReport = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/google/integrationHealth', () => ({
  getIntegrationHealthReport: (...args: unknown[]) => getIntegrationHealthReport(...args),
}));

import { GET } from '../route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/settings/integrations/health', {
    method: 'GET',
  });
}

describe('GET /api/admin/settings/integrations/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    getIntegrationHealthReport.mockResolvedValue({
      overallStatus: 'healthy',
      jobs: [],
      recentFailures: [],
      lastSyncError: null,
      lastSyncErrorAt: null,
      driveEnabled: true,
      calendarEnabled: true,
    });
  });

  it('blocks unauthorized requests', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(getIntegrationHealthReport).not.toHaveBeenCalled();
  });

  it('returns health DTO for authorized admin without calling Google', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.overallStatus).toBe('healthy');
    expect(json.jobs).toEqual([]);
    expect(json.recentFailures).toEqual([]);
    expect(json).toHaveProperty('lastSyncError');
    expect(json).toHaveProperty('driveEnabled');
    expect(json).toHaveProperty('calendarEnabled');
    expect(getIntegrationHealthReport).toHaveBeenCalledTimes(1);
  });
});
