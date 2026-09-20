import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceFeedbackStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  jobFindUnique: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceFeedback: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      create: mocks.create,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
    job: {
      findUnique: mocks.jobFindUnique,
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: mocks.logAuditEntry,
}));

import {
  getPublicFeedbackByToken,
  getReleasedFeedbackForCleaner,
  isValidStarRating,
  listServiceFeedbackForAdmin,
  listReleasedFeedbackForCleaner,
  requestServiceFeedbackForJob,
  submitCleanerFeedbackResponse,
  submitPublicFeedback,
  validateFeedbackSubmit,
  claimFeedbackReminders,
  adminUpdateServiceFeedback,
} from '@/lib/feedback/serviceFeedback';

describe('ServiceFeedback validation', () => {
  it('accepts ratings 1–5 only', () => {
    expect(isValidStarRating(1)).toBe(true);
    expect(isValidStarRating(5)).toBe(true);
    expect(isValidStarRating(0)).toBe(false);
    expect(isValidStarRating(6)).toBe(false);
    expect(isValidStarRating(3.5)).toBe(false);
  });

  it('requires four dimensions', () => {
    expect(
      validateFeedbackSubmit({
        overallRating: 5,
        cleanlinessRating: 4,
        communicationRating: 4,
        timelinessRating: 5,
        comment: 'Great',
      })
    ).toBeNull();
    expect(
      validateFeedbackSubmit({
        overallRating: 0,
        cleanlinessRating: 4,
        communicationRating: 4,
        timelinessRating: 5,
      })
    ).toMatch(/Overall/);
  });
});

describe('ServiceFeedback public token flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('audit-1');
  });

  it('invalid token', async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(getPublicFeedbackByToken('nope')).resolves.toEqual({
      state: 'invalid',
    });
  });

  it('ready token for REQUESTED feedback', async () => {
    mocks.findUnique.mockResolvedValue({
      publicToken: 'tok-1',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
      source: 'HOST',
      Job: {
        preferredDate: new Date('2026-10-04T00:00:00.000Z'),
        address: '111 Thomson',
        Property: {
          name: "Lou Lou's Landing",
          address: '111 Thomson',
          guestDisplayName: null,
        },
      },
    });
    const view = await getPublicFeedbackByToken('tok-1');
    expect(view.state).toBe('ready');
    if (view.state === 'ready') {
      expect(view.propertyLabel).toContain('Lou Lou');
      expect(view.serviceDate).toMatch(/October/);
    }
  });

  it('guest public label never uses street address', async () => {
    mocks.findUnique.mockResolvedValue({
      publicToken: 'tok-g',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
      source: 'GUEST',
      Job: {
        preferredDate: new Date('2026-10-04T00:00:00.000Z'),
        address: '111 Thomson Secret',
        Property: {
          name: 'Smith Family Home',
          address: '111 Thomson Secret',
          guestDisplayName: null,
        },
      },
    });
    const view = await getPublicFeedbackByToken('tok-g');
    expect(view.state).toBe('ready');
    if (view.state === 'ready') {
      expect(view.propertyLabel).toBe('this property');
      expect(view.propertyLabel).not.toMatch(/Thomson|Smith/i);
    }
  });

  it('already submitted does not expose writable form', async () => {
    mocks.findUnique.mockResolvedValue({
      publicToken: 'tok-1',
      status: ServiceFeedbackStatus.SUBMITTED,
      submittedAt: new Date(),
      Job: { preferredDate: null, address: null, Property: null },
    });
    await expect(getPublicFeedbackByToken('tok-1')).resolves.toMatchObject({
      state: 'already_submitted',
    });
  });

  it('submit persists four dimensions and low rating → UNDER_REVIEW', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'fb-1',
      publicToken: 'tok-1',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await submitPublicFeedback('tok-1', {
      overallRating: 2,
      cleanlinessRating: 3,
      communicationRating: 2,
      timelinessRating: 3,
      comment: 'Dust on stairs',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(ServiceFeedbackStatus.UNDER_REVIEW);
      expect(result.alreadySubmitted).toBe(false);
    }
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          overallRating: 2,
          cleanlinessRating: 3,
          communicationRating: 2,
          timelinessRating: 3,
          status: ServiceFeedbackStatus.UNDER_REVIEW,
        }),
      })
    );
  });

  it('high rating does not enter UNDER_REVIEW', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'fb-2',
      publicToken: 'tok-2',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const result = await submitPublicFeedback('tok-2', {
      overallRating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(ServiceFeedbackStatus.SUBMITTED);
    }
  });

  it('duplicate submit does not overwrite', async () => {
    mocks.findUnique
      .mockResolvedValueOnce({
        id: 'fb-1',
        publicToken: 'tok-1',
        status: ServiceFeedbackStatus.REQUESTED,
        submittedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'fb-1',
        status: ServiceFeedbackStatus.SUBMITTED,
      });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await submitPublicFeedback('tok-1', {
      overallRating: 1,
      cleanlinessRating: 1,
      communicationRating: 1,
      timelinessRating: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadySubmitted).toBe(true);
  });

  it('request is one per job for HOST source only', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      customerId: 'cust-1',
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      Customer: { id: 'cust-1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
    });
    mocks.findUnique.mockResolvedValue({
      id: 'existing',
      publicToken: 'tok',
      jobId: 'job-1',
      source: 'HOST',
      submittedAt: null,
      requestedAt: new Date(),
    });

    const result = await requestServiceFeedbackForJob('job-1', 'admin-1');
    expect(result.alreadyExists).toBe(true);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId_source: { jobId: 'job-1', source: 'HOST' } },
      })
    );
  });
});

describe('Cleaner release visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unrelated cleaner cannot load released feedback', async () => {
    const { getReleasedFeedbackForCleaner } = await import(
      '@/lib/feedback/serviceFeedback'
    );
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      getReleasedFeedbackForCleaner('fb-1', 'other-cleaner')
    ).resolves.toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'fb-1',
          cleanerId: 'other-cleaner',
        }),
      })
    );
  });

  it('assigned cleaner can load released feedback', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'fb-1',
      cleanerId: 'cleaner-1',
      status: ServiceFeedbackStatus.RELEASED,
      releasedAt: new Date(),
      Job: { jobReference: 'VM-1', preferredDate: null, address: null, Property: null },
    });
    const row = await getReleasedFeedbackForCleaner('fb-1', 'cleaner-1');
    expect(row?.id).toBe('fb-1');
  });

  it('cleaner cannot respond to unreleased feedback', async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      submitCleanerFeedbackResponse('fb-1', 'cleaner-1', 'Notes')
    ).rejects.toThrow(/not found or not released/i);
  });
});

describe('Admin branch query filter + reminder claim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listServiceFeedbackForAdmin scopes by Job.branchId', async () => {
    mocks.findMany.mockResolvedValue([]);
    await listServiceFeedbackForAdmin({ authBranchId: 'branch-vt' });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          Job: { is: { branchId: 'branch-vt' } },
        }),
      })
    );
  });

  it('adminUpdate denies cross-branch via findFirst null', async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      adminUpdateServiceFeedback('fb-nj', { action: 'resolve' }, 'admin-vt', 'branch-vt')
    ).rejects.toThrow(/not found/i);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('claimFeedbackReminders only claims REQUESTED without reminderSentAt', async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: 'fb-1',
        status: ServiceFeedbackStatus.REQUESTED,
        submittedAt: null,
        reminderSentAt: null,
      },
    ]);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({
      id: 'fb-1',
      status: ServiceFeedbackStatus.REQUESTED,
      reminderSentAt: new Date(),
    });

    const claimed = await claimFeedbackReminders(10);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          source: 'HOST',
          status: ServiceFeedbackStatus.REQUESTED,
          submittedAt: null,
          reminderSentAt: null,
        }),
      })
    );
    expect(claimed).toHaveLength(1);
  });

  it('optional comment may be null', () => {
    expect(
      validateFeedbackSubmit({
        overallRating: 4,
        cleanlinessRating: 4,
        communicationRating: 4,
        timelinessRating: 4,
        comment: null,
      })
    ).toBeNull();
  });
});

describe('Customer token isolation + reminder guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('audit-1');
  });

  it('token A cannot submit as if it were token B', async () => {
    mocks.findUnique.mockResolvedValue(null);
    const result = await submitPublicFeedback('token-a', {
      overallRating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
    });
    expect(result).toEqual({
      ok: false,
      error: 'Feedback link is invalid',
      code: 'INVALID_TOKEN',
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it('public view never exposes cleanerResponse or adminNotes', async () => {
    mocks.findUnique.mockResolvedValue({
      publicToken: 'tok-1',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
      cleanerResponse: 'secret internal',
      adminNotes: 'secret admin',
      Job: {
        preferredDate: null,
        address: 'X',
        Property: null,
      },
    });
    const view = await getPublicFeedbackByToken('tok-1');
    expect(view).toEqual({
      state: 'ready',
      token: 'tok-1',
      propertyLabel: 'X',
      serviceDate: null,
    });
    expect(JSON.stringify(view)).not.toMatch(/cleanerResponse|adminNotes|secret/);
  });

  it('claimFeedbackReminders excludes already-submitted rows', async () => {
    mocks.findMany.mockResolvedValue([]);
    await claimFeedbackReminders(5);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          submittedAt: null,
          reminderSentAt: null,
          status: ServiceFeedbackStatus.REQUESTED,
        }),
      })
    );
  });

  it('listReleasedFeedbackForCleaner requires RELEASED/RESOLVED + cleanerId', async () => {
    mocks.findMany.mockResolvedValue([]);
    await listReleasedFeedbackForCleaner('cleaner-1');
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cleanerId: 'cleaner-1',
          releasedAt: { not: null },
          status: {
            in: [ServiceFeedbackStatus.RELEASED, ServiceFeedbackStatus.RESOLVED],
          },
        }),
      })
    );
  });
});
