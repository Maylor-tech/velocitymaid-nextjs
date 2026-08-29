import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requirePhotoUploadAccess = vi.fn();
const assertJobExists = vi.fn();
const createCleanPhotoSignedUpload = vi.fn();

vi.mock('@/lib/dispatch/photoAuth', () => ({
  requirePhotoUploadAccess: (...args: unknown[]) => requirePhotoUploadAccess(...args),
}));

vi.mock('@/lib/photos/cleanPhotoStorage.server', () => ({
  assertJobExists: (...args: unknown[]) => assertJobExists(...args),
  createCleanPhotoSignedUpload: (...args: unknown[]) =>
    createCleanPhotoSignedUpload(...args),
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

import { POST } from '@/app/api/jobs/[jobId]/photos/sign/route';

const JOB_ID = 'job-1';
const SIGNED = { uploadUrl: 'https://storage.example/sign', path: 'jobs/job-1/a.jpg' };

function signRequest() {
  return new NextRequest(`http://localhost/api/jobs/${JOB_ID}/photos/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'after.jpg',
      contentType: 'image/jpeg',
      fileSize: 12000,
    }),
  });
}

describe('POST /api/jobs/[jobId]/photos/sign auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertJobExists.mockResolvedValue(undefined);
    createCleanPhotoSignedUpload.mockResolvedValue(SIGNED);
  });

  it('rejects unauthenticated callers', async () => {
    requirePhotoUploadAccess.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await POST(signRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(401);
    expect(createCleanPhotoSignedUpload).not.toHaveBeenCalled();
  });

  it('allows an admin upload', async () => {
    requirePhotoUploadAccess.mockResolvedValue({ role: 'ADMIN', userId: 'admin-1' });
    const res = await POST(signRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(SIGNED);
  });

  it('allows the currently assigned cleaner', async () => {
    requirePhotoUploadAccess.mockResolvedValue({
      role: 'CLEANER',
      userId: 'cleaner-1',
    });
    const res = await POST(signRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
  });

  it('rejects the wrong cleaner', async () => {
    requirePhotoUploadAccess.mockRejectedValue(
      NextResponse.json(
        { error: 'Forbidden: you may only upload photos for jobs assigned to you' },
        { status: 403 }
      )
    );
    const res = await POST(signRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(403);
    expect(createCleanPhotoSignedUpload).not.toHaveBeenCalled();
  });

  it('allows a cleaner with an accepted offer', async () => {
    requirePhotoUploadAccess.mockResolvedValue({
      role: 'CLEANER',
      userId: 'cleaner-offer',
    });
    const res = await POST(signRequest(), { params: { jobId: JOB_ID } });
    expect(res.status).toBe(200);
  });
});
