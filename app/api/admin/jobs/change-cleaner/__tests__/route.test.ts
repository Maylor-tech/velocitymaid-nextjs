/**
 * POST /api/admin/jobs/change-cleaner — ineligible cleaners are rejected
 * before assignedCleanerId is written.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const requireRole = vi.fn();
const jobFindUnique = vi.fn();
const jobUpdate = vi.fn();
const userFindUnique = vi.fn();
const applicationFindFirst = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => jobFindUnique(...args),
      update: (...args: unknown[]) => jobUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
    cleanerApplication: {
      findFirst: (...args: unknown[]) => applicationFindFirst(...args),
    },
  },
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: vi.fn(),
}));

vi.mock('@/lib/notifications/cleanerAssignmentEmail', () => ({
  notifyCleanerOfAssignmentByEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/sendCleanerAssignment', () => ({
  sendCleanerAssignment: vi.fn(),
}));

import { POST } from '../route';

const JOB_ID = 'job-1';

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/jobs/change-cleaner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/jobs/change-cleaner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({
      userId: 'admin-1',
      role: 'ADMIN',
      isOwner: true,
      branchIds: [],
    });
    jobFindUnique.mockResolvedValue({
      id: JOB_ID,
      branchId: 'branch-vt',
      status: 'CONFIRMED',
      Branch: { id: 'branch-vt', name: 'Vermont', slug: 'vermont', country: 'US' },
      Customer: { firstName: 'Ada', lastName: 'Lovelace', phone: null },
    });
    applicationFindFirst.mockResolvedValue(null);
    jobUpdate.mockResolvedValue({ id: JOB_ID, User: null });
  });

  it('rejects an ineligible cleaner before writing the assignment', async () => {
    userFindUnique.mockResolvedValue({
      id: 'cleaner-nj',
      email: 'cleaner-nj@example.test',
      name: 'Cleaner',
      isActive: true,
      primaryBranchId: 'branch-nj',
      UserBranch: [{ Branch: { id: 'branch-nj' } }],
      TrainingStatus: null,
      CleanerProfile: { isInternalTeam: false },
    });

    const res = await POST(post({ jobId: JOB_ID, cleanerId: 'cleaner-nj', sendWhatsApp: false }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('NOT_APPROVED');
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('assigns an eligible cleaner on the job branch', async () => {
    userFindUnique.mockResolvedValue({
      id: 'cleaner-ok',
      email: 'cleaner-ok@example.test',
      name: 'Eligible',
      isActive: true,
      primaryBranchId: 'branch-vt',
      UserBranch: [{ Branch: { id: 'branch-vt' } }],
      TrainingStatus: null,
      CleanerProfile: { isInternalTeam: true },
    });

    const res = await POST(post({ jobId: JOB_ID, cleanerId: 'cleaner-ok', sendWhatsApp: false }));
    expect(res.status).toBe(200);
    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: JOB_ID },
        data: expect.objectContaining({ assignedCleanerId: 'cleaner-ok' }),
      })
    );
  });
});
