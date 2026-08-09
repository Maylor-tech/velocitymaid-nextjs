/**
 * Route-level auth + response shape for POST sync-google.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const syncJobToGoogle = vi.fn();
const requireRole = vi.fn();
const logAuditEntry = vi.fn();

vi.mock('@/lib/google/syncJobToGoogle', () => ({
  syncJobToGoogle: (...args: unknown[]) => syncJobToGoogle(...args),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => logAuditEntry(...args),
}));

import { POST } from '../route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/jobs/job-1/sync-google', {
    method: 'POST',
  });
}

describe('POST /api/admin/jobs/[jobId]/sync-google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    syncJobToGoogle.mockResolvedValue({
      jobId: 'job-1',
      drive: { status: 'synced', message: 'ok', folderId: 'f1' },
      calendar: { status: 'synced', message: 'ok', eventId: 'e1' },
    });
    logAuditEntry.mockResolvedValue(undefined);
  });

  it('unauthorized request blocked', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const res = await POST(makeRequest(), { params: { jobId: 'job-1' } });
    expect(res.status).toBe(401);
    expect(syncJobToGoogle).not.toHaveBeenCalled();
  });

  it('returns per-integration results for authorized admin', async () => {
    const res = await POST(makeRequest(), { params: { jobId: 'job-1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.drive.status).toBe('synced');
    expect(json.calendar.status).toBe('synced');
    expect(syncJobToGoogle).toHaveBeenCalledWith('job-1');
    expect(logAuditEntry).toHaveBeenCalled();
  });

  it('returns 404 when job missing', async () => {
    syncJobToGoogle.mockRejectedValue(new Error('JOB_NOT_FOUND'));
    const res = await POST(makeRequest(), { params: { jobId: 'missing' } });
    expect(res.status).toBe(404);
  });
});
