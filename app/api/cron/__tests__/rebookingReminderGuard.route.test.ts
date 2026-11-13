import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  jobFindMany,
  jobCount,
  auditFindMany,
  deliveryFindMany,
  deliveryCreate,
  deliveryUpdateMany,
  sendRebooking,
  logAudit,
  verifyCronAuth,
} = vi.hoisted(() => ({
  jobFindMany: vi.fn(),
  jobCount: vi.fn(),
  auditFindMany: vi.fn(),
  deliveryFindMany: vi.fn(),
  deliveryCreate: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  sendRebooking: vi.fn(),
  logAudit: vi.fn(),
  verifyCronAuth: vi.fn(),
}));

vi.mock('@/lib/cron/verifyCronAuth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/cron/verifyCronAuth')>(
    '@/lib/cron/verifyCronAuth'
  );
  verifyCronAuth.mockImplementation(actual.verifyCronAuth);
  return { verifyCronAuth };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findMany: jobFindMany, count: jobCount },
    auditLog: { findMany: auditFindMany },
    rebookingReminderDelivery: {
      findMany: deliveryFindMany,
      create: deliveryCreate,
      updateMany: deliveryUpdateMany,
    },
  },
}));
vi.mock('@/lib/email/cronAutomationEmails', () => ({
  sendRebookingReminderEmail: sendRebooking,
}));
vi.mock('@/lib/audit', () => ({ logAuditEntry: logAudit }));

import { GET as rebookingGet, POST as rebookingPost } from '../rebooking-reminders/route';

const SECRET = 'test-cron-secret';
const DISABLED = {
  success: true,
  disabled: true,
  processed: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
};

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new NextRequest('http://localhost/api/cron/rebooking-reminders', { headers });
}

describe('original rebooking route is disabled-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the disabled body for GET and POST without auth, ledger, or provider work', async () => {
    for (const handler of [rebookingGet, rebookingPost]) {
      const anonymous = await handler(request());
      const authorized = await handler(request(`Bearer ${SECRET}`));
      const wrong = await handler(request('Bearer wrong-secret'));
      for (const response of [anonymous, authorized, wrong]) {
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(DISABLED);
      }
    }
    expect(verifyCronAuth).not.toHaveBeenCalled();
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(jobCount).not.toHaveBeenCalled();
    expect(auditFindMany).not.toHaveBeenCalled();
    expect(deliveryFindMany).not.toHaveBeenCalled();
    expect(deliveryCreate).not.toHaveBeenCalled();
    expect(deliveryUpdateMany).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it('does not import the sender, the ledger claim helper, or Prisma', () => {
    const source = readFileSync(join(process.cwd(), 'app/api/cron/rebooking-reminders/route.ts'), 'utf8');
    expect(source).not.toContain('deliverClaimedRebookingReminder');
    expect(source).not.toContain('sendRebookingReminderEmail');
    expect(source).not.toContain("from '@/lib/prisma'");
    expect(source).toContain('rebookingRemindersDisabledResponse');
  });
});
