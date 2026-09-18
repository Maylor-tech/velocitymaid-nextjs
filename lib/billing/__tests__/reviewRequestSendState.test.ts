import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reviewRequest: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
  },
}));

import {
  stampGoogleReviewRequestSent,
  wasGoogleReviewRequestSent,
} from '@/lib/billing/reviewRequestSendState';

describe('Google ReviewRequest sentAt stamp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wasGoogleReviewRequestSent true when sentAt present', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'rr-1' });
    await expect(wasGoogleReviewRequestSent('job-1')).resolves.toBe(true);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { jobId: 'job-1', sentAt: { not: null } },
      select: { id: true },
    });
  });

  it('stamp only updates null sentAt rows', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    await expect(stampGoogleReviewRequestSent('job-1')).resolves.toEqual({
      stamped: 1,
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-1', sentAt: null },
      data: { sentAt: expect.any(Date) },
    });
  });

  it('failed email path should not call stamp (contract)', async () => {
    // Documented contract: callers must only stamp when emailResult.sent === true.
    // This test locks the helper to be safe if called with zero rows.
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(stampGoogleReviewRequestSent('job-x')).resolves.toEqual({
      stamped: 0,
    });
  });
});
