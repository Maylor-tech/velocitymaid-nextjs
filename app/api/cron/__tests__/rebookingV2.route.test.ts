import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findUnique,
  jobFindMany,
  jobCount,
  auditFindMany,
  deliveryFindMany,
  deliveryCreate,
  deliveryUpdateMany,
  sendBuilt,
  logAudit,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  jobFindMany: vi.fn(),
  jobCount: vi.fn(),
  auditFindMany: vi.fn(),
  deliveryFindMany: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  sendBuilt: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rebookingExecutionControl: { findUnique },
    job: { findMany: jobFindMany, count: jobCount },
    auditLog: { findMany: auditFindMany, create: vi.fn() },
    rebookingReminderDelivery: {
      findMany: deliveryFindMany,
      create: deliveryCreate,
      updateMany: deliveryUpdateMany,
    },
  },
}));
vi.mock('@/lib/email/cronAutomationEmails', async () => {
  const actual = await vi.importActual<typeof import('@/lib/email/cronAutomationEmails')>(
    '@/lib/email/cronAutomationEmails'
  );
  return { ...actual, sendBuiltRebookingReminder: sendBuilt };
});
vi.mock('@/lib/audit', () => ({ logAuditEntry: logAudit }));

import { GET as v2Get, POST as v2Post } from '../rebooking-reminders-v2/route';

const SECRET = 'test-cron-secret';
const DEPLOYMENT = 'dpl_AcceptedDeployment123';
const SHA = 'e0dfe44cf94423910c9c5c9d2a05863db224fcfd';

function request(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/cron/rebooking-reminders-v2?deployment=spoofed', {
    headers,
  });
}

function productionEnv() {
  vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('VERCEL_DEPLOYMENT_ID', DEPLOYMENT);
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA);
  vi.stubEnv('CRON_SECRET', SECRET);
}

describe('rebooking v2 route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.REBOOKING_REMINDERS_ENABLED;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_DEPLOYMENT_ID;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    vi.stubEnv('CRON_SECRET', SECRET);
    findUnique.mockResolvedValue(null);
    jobFindMany.mockResolvedValue([]);
    auditFindMany.mockResolvedValue([]);
    deliveryFindMany.mockResolvedValue([]);
    deliveryUpdateMany.mockResolvedValue({ count: 0 });
    deliveryCreate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed for the flag, environment, and missing identity before any control or delivery work', async () => {
    const cases: Array<{ env: () => void; reason: string }> = [
      { env: () => undefined, reason: 'flag' },
      { env: () => vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'false'), reason: 'flag' },
      { env: () => vi.stubEnv('REBOOKING_REMINDERS_ENABLED', '   '), reason: 'flag' },
      { env: () => vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'yes'), reason: 'flag' },
      {
        env: () => {
          vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
          vi.stubEnv('VERCEL_ENV', 'preview');
        },
        reason: 'environment',
      },
      {
        env: () => {
          vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
          vi.stubEnv('VERCEL_ENV', 'development');
        },
        reason: 'environment',
      },
      {
        env: () => {
          vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
          vi.stubEnv('VERCEL_ENV', 'production');
        },
        reason: 'deployment_id',
      },
      {
        env: () => {
          vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
          vi.stubEnv('VERCEL_ENV', 'production');
          vi.stubEnv('VERCEL_DEPLOYMENT_ID', DEPLOYMENT);
        },
        reason: 'commit_sha',
      },
    ];

    for (const item of cases) {
      vi.unstubAllEnvs();
      vi.stubEnv('CRON_SECRET', SECRET);
      item.env();
      const response = await v2Get(request({
        authorization: `Bearer ${SECRET}`,
        'x-vercel-deployment-id': DEPLOYMENT,
        'x-vercel-git-commit-sha': SHA,
        'user-agent': 'vercel-cron/1.0',
      }));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ success: false, authorized: false, reason: item.reason });
    }
    expect(findUnique).not.toHaveBeenCalled();
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(deliveryCreate).not.toHaveBeenCalled();
    expect(sendBuilt).not.toHaveBeenCalled();
  });

  it('requires cron authentication after the flag and before the control lookup', async () => {
    productionEnv();
    const response = await v2Post(request({
      'x-vercel-deployment-id': DEPLOYMENT,
      'x-cron-secret': 'wrong',
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(findUnique).not.toHaveBeenCalled();
    expect(sendBuilt).not.toHaveBeenCalled();
  });

  it('rejects a missing, disabled, or mismatched control record without selecting candidates', async () => {
    productionEnv();
    findUnique.mockResolvedValueOnce(null);
    findUnique.mockResolvedValueOnce({
      workerKey: 'rebooking-reminders',
      enabled: false,
      approvedDeploymentId: null,
      approvedCommitSha: null,
      generation: 0,
      updatedBy: 'migration:20261113140000',
    });
    findUnique.mockResolvedValueOnce({
      workerKey: 'rebooking-reminders',
      enabled: true,
      approvedDeploymentId: 'dpl_OtherDeployment123',
      approvedCommitSha: SHA,
      generation: 2,
      updatedBy: 'operator:founder',
    });
    const reasons = ['control_missing', 'control_disabled', 'deployment_mismatch'];
    for (const reason of reasons) {
      const response = await v2Get(request({ authorization: `Bearer ${SECRET}` }));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ success: false, authorized: false, reason });
    }
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(sendBuilt).not.toHaveBeenCalled();
  });

  it('runs an authorized empty batch and reports a lookup failure without sending', async () => {
    productionEnv();
    findUnique.mockResolvedValue({
      workerKey: 'rebooking-reminders',
      enabled: true,
      approvedDeploymentId: DEPLOYMENT,
      approvedCommitSha: SHA,
      generation: 3,
      updatedBy: 'operator:founder',
    });
    const empty = await v2Get(request({ authorization: `Bearer ${SECRET}` }));
    expect(empty.status).toBe(200);
    expect(await empty.json()).toMatchObject({ success: true, authorized: true, processed: 0, sent: 0 });
    expect(jobFindMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ preferredDate: 'asc' }, { id: 'asc' }],
      take: 5,
    }));
    expect(sendBuilt).not.toHaveBeenCalled();

    findUnique.mockRejectedValueOnce(new Error('database unavailable'));
    const failed = await v2Get(request({ authorization: `Bearer ${SECRET}` }));
    expect(failed.status).toBe(403);
    expect(await failed.json()).toEqual({ success: false, authorized: false, reason: 'control_lookup_failed' });
  });
});
