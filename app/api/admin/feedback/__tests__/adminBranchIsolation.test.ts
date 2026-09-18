import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceFeedbackStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  list: vi.fn(),
  detail: vi.fn(),
  update: vi.fn(),
  resend: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/feedback/serviceFeedback', () => ({
  DISPOSITION_CATEGORIES: ['SERVICE_QUALITY', 'OTHER'],
  listServiceFeedbackForAdmin: (...a: unknown[]) => mocks.list(...a),
  getServiceFeedbackAdminDetail: (...a: unknown[]) => mocks.detail(...a),
  adminUpdateServiceFeedback: (...a: unknown[]) => mocks.update(...a),
  adminResendServiceFeedbackRequest: (...a: unknown[]) => mocks.resend(...a),
}));

vi.mock('@/lib/brand/careChecklist', () => ({
  CARE_CHECKLIST_TOTAL: 50,
}));

import { GET as listGET } from '@/app/api/admin/feedback/route';
import {
  GET as detailGET,
  PATCH as detailPATCH,
} from '@/app/api/admin/feedback/[id]/route';

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe('Admin feedback branch isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated list', async () => {
    mocks.requireRole.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await listGET(req('http://localhost/api/admin/feedback'));
    expect(res.status).toBe(401);
  });

  it('VT-scoped list passes authBranchId and only returns scoped rows', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
    });
    mocks.list.mockResolvedValue([
      {
        id: 'fb-vt',
        status: ServiceFeedbackStatus.SUBMITTED,
        overallRating: 5,
        cleanlinessRating: 5,
        communicationRating: 5,
        timelinessRating: 5,
        comment: null,
        submittedAt: new Date(),
        requestedAt: new Date(),
        dispositionCategory: null,
        Customer: { id: 'c1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
        Cleaner: null,
        Property: null,
        Job: {
          id: 'j1',
          jobReference: 'VM-VT',
          preferredDate: null,
          address: null,
          status: 'COMPLETED',
          branchId: 'branch-vt',
        },
      },
    ]);

    const res = await listGET(req('http://localhost/api/admin/feedback'));
    const body = await res.json();
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ authBranchId: 'branch-vt' })
    );
    expect(body.items).toHaveLength(1);
    expect(body.items[0].job.branchId).toBe('branch-vt');
  });

  it('VT-scoped detail returns 404 for NJ feedback', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
    });
    mocks.detail.mockResolvedValue(null);

    const res = await detailGET(req('http://localhost/api/admin/feedback/fb-nj'), {
      params: { id: 'fb-nj' },
    });
    expect(res.status).toBe(404);
    expect(mocks.detail).toHaveBeenCalledWith('fb-nj', 'branch-vt');
  });

  it('VT-scoped modify of NJ feedback returns 404', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
    });
    mocks.update.mockRejectedValue(new Error('Feedback not found'));

    const res = await detailPATCH(
      req('http://localhost/api/admin/feedback/fb-nj', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resolve' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: 'fb-nj' } }
    );
    expect(res.status).toBe(404);
    expect(mocks.update).toHaveBeenCalledWith(
      'fb-nj',
      expect.any(Object),
      'admin-vt',
      'branch-vt'
    );
  });

  it('VT-scoped resend of NJ feedback returns 404', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
    });
    mocks.resend.mockRejectedValue(new Error('Feedback not found'));

    const res = await detailPATCH(
      req('http://localhost/api/admin/feedback/fb-nj', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resend_request' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: 'fb-nj' } }
    );
    expect(res.status).toBe(404);
    expect(mocks.resend).toHaveBeenCalledWith('fb-nj', 'admin-vt', 'branch-vt');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('global admin lists without authBranchId filter', async () => {
    mocks.requireRole.mockResolvedValue({
      userId: 'brian',
      role: 'ADMIN',
      // no branchId
    });
    mocks.list.mockResolvedValue([]);
    await listGET(req('http://localhost/api/admin/feedback'));
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ authBranchId: undefined })
    );
  });
});
