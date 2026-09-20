import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';

const requireRole = vi.fn();
const getCustomerSession = vi.fn();
const jobFindUnique = vi.fn();
const userFindFirst = vi.fn();
const tipCreate = vi.fn();
const tipUpdate = vi.fn();
const tipUpdateMany = vi.fn();
const paymentIntentsCreate = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => getCustomerSession(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => userFindFirst(...a) },
    tip: {
      create: (...a: unknown[]) => tipCreate(...a),
      update: (...a: unknown[]) => tipUpdate(...a),
      updateMany: (...a: unknown[]) => tipUpdateMany(...a),
    },
  },
}));

vi.mock('@/lib/tips/references', () => ({
  allocateTipInternalReference: vi.fn(async () => 'VM-TIP-AUTH01'),
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: (...a: unknown[]) => paymentIntentsCreate(...a),
    },
  }),
}));

vi.mock('@/lib/tips/zelleDestination', () => ({
  getVelocityMaidZelleDestination: () => ({
    label: 'VelocityMaid',
    handle: 'tips@example.com',
    instructions: 'Include the memo.',
  }),
}));

import { POST as postStripe } from '@/app/api/tip/create-payment-intent/route';
import { POST as postZelle } from '@/app/api/tip/create-zelle-intent/route';

function postRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/tip/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockOwnerSession() {
  requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
  getCustomerSession.mockResolvedValue({
    customerId: 'cust-1',
    email: 'host@example.com',
  });
}

function mockOwnedCompletedJob() {
  // ownership check
  jobFindUnique.mockResolvedValueOnce({
    id: 'job-1',
    customerId: 'cust-1',
  });
  // resolveTipServiceEarner
  jobFindUnique.mockResolvedValueOnce({
    id: 'job-1',
    status: JobStatus.COMPLETED,
    assignedCleanerId: 'cleaner-dorottya',
    propertyId: 'p1',
    branchId: 'b1',
    marketLabel: 'vermont',
    completedAt: new Date(),
  });
  userFindFirst.mockResolvedValue({ id: 'cleaner-dorottya' });
  tipCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'tip-1',
    ...data,
  }));
}

describe.each([
  ['STRIPE', postStripe],
  ['ZELLE', postZelle],
] as const)('POST tip create %s authorization', (method, POST) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json(
        { success: false, error: 'Unauthorized: Customer authentication required' },
        { status: 401 }
      )
    );

    const res = await POST(
      postRequest({ jobId: 'job-1', amount: 20 })
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 for another customer job (fail closed)', async () => {
    mockOwnerSession();
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-other',
      customerId: 'cust-other',
    });

    const res = await POST(
      postRequest({ jobId: 'job-other', amount: 20 })
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('JOB_NOT_FOUND');
    expect(tipCreate).not.toHaveBeenCalled();
  });

  it('returns 404 for nonexistent job', async () => {
    mockOwnerSession();
    jobFindUnique.mockResolvedValueOnce(null);

    const res = await POST(
      postRequest({ jobId: 'missing', amount: 20 })
    );
    expect(res.status).toBe(404);
    expect(tipCreate).not.toHaveBeenCalled();
  });

  it('returns 409 for own incomplete job', async () => {
    mockOwnerSession();
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      customerId: 'cust-1',
    });
    jobFindUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: JobStatus.ASSIGNED,
      assignedCleanerId: 'cleaner-dorottya',
      propertyId: null,
      branchId: 'b1',
      marketLabel: null,
      completedAt: null,
    });

    const res = await POST(
      postRequest({ jobId: 'job-1', amount: 20 })
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('JOB_NOT_COMPLETED');
    expect(tipCreate).not.toHaveBeenCalled();
  });

  it('rejects client-supplied cleaner identity', async () => {
    mockOwnerSession();

    const res = await POST(
      postRequest({
        jobId: 'job-1',
        amount: 20,
        cleanerId: 'attacker-cleaner',
        cleanerName: 'Not The Cleaner',
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN_FIELD');
    expect(tipCreate).not.toHaveBeenCalled();
  });

  it('creates tip for own COMPLETED job with server-frozen beneficiary', async () => {
    mockOwnerSession();
    mockOwnedCompletedJob();

    if (method === 'STRIPE') {
      paymentIntentsCreate.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'pi_test_secret',
      });
      tipUpdate.mockResolvedValue({ id: 'tip-1' });
    }

    const res = await POST(
      postRequest({ jobId: 'job-1', amount: 25 })
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(tipCreate).toHaveBeenCalled();
    const created = tipCreate.mock.calls[0][0].data;
    expect(created.beneficiaryCleanerId).toBe('cleaner-dorottya');
    expect(created.jobId).toBe('job-1');
    expect(created.paymentMethod).toBe(method);

    if (method === 'STRIPE') {
      expect(body.clientSecret).toBe('pi_test_secret');
      expect(paymentIntentsCreate).toHaveBeenCalled();
      const meta = paymentIntentsCreate.mock.calls[0][0].metadata;
      expect(meta.beneficiaryCleanerId).toBe('cleaner-dorottya');
      expect(tipUpdateMany).not.toHaveBeenCalled();
    } else {
      expect(body.paymentMethod).toBe('ZELLE');
      expect(body.internalReference).toBe('VM-TIP-AUTH01');
      expect(body.zelle.handle).toBeTruthy();
    }
  });
});

describe('POST tip create STRIPE compensation (host path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('host Stripe failure abandons PENDING tip (no orphan liability)', async () => {
    mockOwnerSession();
    mockOwnedCompletedJob();
    paymentIntentsCreate.mockRejectedValue(new Error('stripe_unavailable'));
    tipUpdateMany.mockResolvedValue({ count: 1 });

    const res = await postStripe(postRequest({ jobId: 'job-1', amount: 25 }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe('STRIPE_CREATE_FAILED');
    expect(tipCreate).toHaveBeenCalledTimes(1);
    expect(tipUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'tip-1',
          status: 'PENDING',
          stripePaymentIntentId: null,
        }),
        data: { status: 'FAILED' },
      })
    );
    expect(tipUpdate).not.toHaveBeenCalled();
  });

  it('host Stripe success attaches PI without abandon', async () => {
    mockOwnerSession();
    mockOwnedCompletedJob();
    paymentIntentsCreate.mockResolvedValue({
      id: 'pi_host',
      client_secret: 'sec_host',
    });
    tipUpdate.mockResolvedValue({ id: 'tip-1' });

    const res = await postStripe(postRequest({ jobId: 'job-1', amount: 25 }));
    expect(res.status).toBe(200);
    expect(tipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { stripePaymentIntentId: 'pi_host' },
      })
    );
    expect(tipUpdateMany).not.toHaveBeenCalled();
  });
});
