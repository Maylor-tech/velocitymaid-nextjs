/**
 * PUT/GET /api/admin/jobs/[jobId]/team — auth, ordering, empty team, calendar await.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const jobFindUnique = vi.fn();
const deleteMany = vi.fn();
const createMany = vi.fn();
const jobUpdate = vi.fn();
const loadJobTeamMembers = vi.fn();
const awaitJobCalendarSync = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => jobFindUnique(...args),
      update: (...args: unknown[]) => jobUpdate(...args),
    },
    jobTeamMember: {
      deleteMany: (...args: unknown[]) => deleteMany(...args),
      createMany: (...args: unknown[]) => createMany(...args),
    },
  },
}));

vi.mock('@/lib/cleaners/internalCleanerService', () => ({
  loadJobTeamMembers: (...args: unknown[]) => loadJobTeamMembers(...args),
}));

vi.mock('@/lib/google/jobGoogleSync', () => ({
  awaitJobCalendarSync: (...args: unknown[]) => awaitJobCalendarSync(...args),
}));

import { GET, PUT } from '../route';

const BRIAN = 'brian-id';
const CARYLL = 'caryll-id';
const DORI = 'dori-id';
const JOB_ID = 'job-1';

function putRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/admin/jobs/${JOB_ID}/team`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/admin/jobs/${JOB_ID}/team`, {
    method: 'GET',
  });
}

describe('GET/PUT /api/admin/jobs/[jobId]/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    jobFindUnique.mockResolvedValue({ id: JOB_ID });
    deleteMany.mockResolvedValue({ count: 0 });
    createMany.mockResolvedValue({ count: 0 });
    jobUpdate.mockResolvedValue({});
    loadJobTeamMembers.mockResolvedValue([]);
  });

  it('blocks unauthorized access', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await PUT(putRequest({ cleanerIds: [BRIAN] }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(401);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('one cleaner → primary assigned + calendar sync', async () => {
    loadJobTeamMembers.mockResolvedValue([{ id: BRIAN, name: 'Brian' }]);
    const res = await PUT(putRequest({ cleanerIds: [BRIAN] }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    expect(deleteMany).toHaveBeenCalledWith({ where: { jobId: JOB_ID } });
    expect(createMany).toHaveBeenCalledWith({
      data: [{ jobId: JOB_ID, cleanerId: BRIAN, sortOrder: 0 }],
    });
    expect(jobUpdate).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { assignedCleanerId: BRIAN, assignedAt: expect.any(Date) },
    });
    expect(awaitJobCalendarSync).toHaveBeenCalledWith(JOB_ID);
  });

  it('Brian + Caryll → ordered team; Brian is primary', async () => {
    loadJobTeamMembers.mockResolvedValue([
      { id: BRIAN, name: 'Brian' },
      { id: CARYLL, name: 'Caryll' },
    ]);
    await PUT(putRequest({ cleanerIds: [BRIAN, CARYLL] }), {
      params: { jobId: JOB_ID },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { jobId: JOB_ID, cleanerId: BRIAN, sortOrder: 0 },
        { jobId: JOB_ID, cleanerId: CARYLL, sortOrder: 1 },
      ],
    });
    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedCleanerId: BRIAN }),
      })
    );
    expect(awaitJobCalendarSync).toHaveBeenCalledWith(JOB_ID);
  });

  it('three-person team preserves sortOrder', async () => {
    await PUT(putRequest({ cleanerIds: [BRIAN, CARYLL, DORI] }), {
      params: { jobId: JOB_ID },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { jobId: JOB_ID, cleanerId: BRIAN, sortOrder: 0 },
        { jobId: JOB_ID, cleanerId: CARYLL, sortOrder: 1 },
        { jobId: JOB_ID, cleanerId: DORI, sortOrder: 2 },
      ],
    });
  });

  it('changing primary (Caryll first) updates assignedCleanerId and calendars', async () => {
    await PUT(putRequest({ cleanerIds: [CARYLL, BRIAN] }), {
      params: { jobId: JOB_ID },
    });
    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedCleanerId: CARYLL }),
      })
    );
    expect(awaitJobCalendarSync).toHaveBeenCalledWith(JOB_ID);
  });

  it('removing an assistant is a full replace without that id', async () => {
    await PUT(putRequest({ cleanerIds: [BRIAN, DORI] }), {
      params: { jobId: JOB_ID },
    });
    expect(deleteMany).toHaveBeenCalled();
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { jobId: JOB_ID, cleanerId: BRIAN, sortOrder: 0 },
        { jobId: JOB_ID, cleanerId: DORI, sortOrder: 1 },
      ],
    });
  });

  it('clearing Brian + Caryll → no team rows, assignedCleanerId null, calendar sync queued', async () => {
    loadJobTeamMembers.mockResolvedValue([]);
    const res = await PUT(putRequest({ cleanerIds: [] }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    expect(deleteMany).toHaveBeenCalledWith({ where: { jobId: JOB_ID } });
    expect(createMany).not.toHaveBeenCalled();
    expect(jobUpdate).toHaveBeenCalledWith({
      where: { id: JOB_ID },
      data: { assignedCleanerId: null },
    });
    expect(awaitJobCalendarSync).toHaveBeenCalledWith(JOB_ID);
    const json = await res.json();
    expect(json.team).toEqual([]);
  });

  it('empty team remains a valid PUT payload', async () => {
    loadJobTeamMembers.mockResolvedValue([]);
    const res = await PUT(putRequest({ cleanerIds: [] }), {
      params: { jobId: JOB_ID },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('GET returns team for authorized admin', async () => {
    loadJobTeamMembers.mockResolvedValue([{ id: BRIAN, name: 'Brian' }]);
    const res = await GET(getRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.team).toHaveLength(1);
  });

  it('GET blocks unauthorized access', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(getRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(401);
    expect(loadJobTeamMembers).not.toHaveBeenCalled();
  });
});
