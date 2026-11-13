import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique, jobFindMany, jobCount, auditFindMany, deliveryFindMany, deliveryCreate, deliveryUpdateMany, sendBuilt } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  jobFindMany: vi.fn(),
  jobCount: vi.fn(),
  auditFindMany: vi.fn(),
  deliveryFindMany: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  sendBuilt: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rebookingExecutionControl: { findUnique },
    job: { findMany: jobFindMany, count: jobCount },
    auditLog: { findMany: auditFindMany },
    rebookingReminderDelivery: { findMany: deliveryFindMany, create: deliveryCreate, updateMany: deliveryUpdateMany },
  },
}));
vi.mock('@/lib/email/cronAutomationEmails', async () => {
  const actual = await vi.importActual<typeof import('@/lib/email/cronAutomationEmails')>(
    '@/lib/email/cronAutomationEmails'
  );
  return { ...actual, sendBuiltRebookingReminder: sendBuilt };
});
vi.mock('@/lib/audit', () => ({ logAuditEntry: vi.fn(async () => 'audit') }));

import { runAuthorizedRebookingBatch } from '@/lib/cron/rebookingV2Run';

const control = {
  workerKey: 'rebooking-reminders',
  enabled: true,
  approvedDeploymentId: 'dpl_AcceptedDeployment123',
  approvedCommitSha: 'e0dfe44cf94423910c9c5c9d2a05863db224fcfd',
  generation: 3,
  updatedBy: 'operator:founder',
};

function job(id: string, preferredDate: Date) {
  return {
    id,
    customerId: 'customer-1',
    preferredDate,
    address: '1 Main St',
    status: 'RECEIVED',
    Customer: { email: 'host@example.com', firstName: 'Alex', defaultAddress: null, addressLine1: null },
  };
}

describe('rebooking v2 batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_DEPLOYMENT_ID', control.approvedDeploymentId);
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', control.approvedCommitSha);
    findUnique.mockResolvedValue(control);
    auditFindMany.mockResolvedValue([]);
    deliveryUpdateMany.mockResolvedValue({ count: 1 });
    deliveryFindMany.mockResolvedValue([]);
    jobCount.mockResolvedValue(0);
    deliveryCreate.mockImplementation(async ({ data }: { data: { jobId: string; payloadFingerprint: string } }) => data);
    sendBuilt.mockResolvedValue({ sent: true, id: 'msg' });
  });

  it('sends no more than the five jobs returned in checkout order and skips terminal rows', async () => {
    const checkout = new Date('2026-11-20T15:00:00.000Z');
    jobFindMany.mockResolvedValue([
      job('job-a', checkout),
      job('job-b', checkout),
    ]);
    deliveryFindMany.mockResolvedValue([{ jobId: 'job-a', status: 'ACCEPTED' }]);
    const result = await runAuthorizedRebookingBatch(3);
    expect(result).toMatchObject({ success: true, sent: 1, skipped: 1 });
    expect(sendBuilt).toHaveBeenCalledTimes(1);
    expect(deliveryCreate).toHaveBeenCalledTimes(1);
    expect(jobFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it('stops before a later claim when generation changes', async () => {
    const checkout = new Date('2026-11-20T15:00:00.000Z');
    jobFindMany.mockResolvedValue([job('job-a', checkout), job('job-b', checkout)]);
    let reads = 0;
    findUnique.mockImplementation(async () => {
      reads += 1;
      if (reads >= 5) return { ...control, generation: 4 };
      return control;
    });
    const result = await runAuthorizedRebookingBatch(3);
    expect(result).toMatchObject({ success: false, reason: 'generation_changed', sent: 1 });
    expect(sendBuilt).toHaveBeenCalledTimes(1);
    expect(deliveryCreate).toHaveBeenCalledTimes(1);
  });
});
