import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const findUnique = vi.fn();
const offerFindFirst = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...args: unknown[]) => findUnique(...args) },
    jobOffer: { findFirst: (...args: unknown[]) => offerFindFirst(...args) },
  },
}));

import { requirePhotoUploadAccess } from '../photoAuth';

describe('photo upload auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindFirst.mockResolvedValue(null);
  });

  it('rejects unauthenticated callers', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const req = new NextRequest('http://localhost/api/jobs/job-1/photos/sign', {
      method: 'POST',
    });
    await expect(requirePhotoUploadAccess(req, 'job-1')).rejects.toBeInstanceOf(
      NextResponse
    );
  });

  it('allows an assigned cleaner', async () => {
    requireRole
      .mockRejectedValueOnce(NextResponse.json({ error: 'no admin' }, { status: 401 }))
      .mockResolvedValueOnce({ userId: 'cleaner-1', role: 'CLEANER' });
    findUnique.mockResolvedValue({ id: 'job-1', assignedCleanerId: 'cleaner-1' });
    const req = new NextRequest('http://localhost/api/jobs/job-1/photos/sign', {
      method: 'POST',
    });
    const actor = await requirePhotoUploadAccess(req, 'job-1');
    expect(actor).toEqual({ role: 'CLEANER', userId: 'cleaner-1' });
  });

  it('forbids a cleaner who is not assigned and has no accepted offer', async () => {
    requireRole
      .mockRejectedValueOnce(NextResponse.json({ error: 'no admin' }, { status: 401 }))
      .mockResolvedValueOnce({ userId: 'cleaner-2', role: 'CLEANER' });
    findUnique.mockResolvedValue({ id: 'job-1', assignedCleanerId: 'cleaner-1' });
    const req = new NextRequest('http://localhost/api/jobs/job-1/photos/sign', {
      method: 'POST',
    });
    await expect(requirePhotoUploadAccess(req, 'job-1')).rejects.toBeInstanceOf(
      NextResponse
    );
  });
});
