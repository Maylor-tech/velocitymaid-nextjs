import { NextRequest } from 'next/server';
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

import { GET as rebookingReminders } from '../rebooking-reminders/route';

const SECRET = 'test-cron-secret';

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new NextRequest('http://localhost/api/cron/rebooking-reminders', { headers });
}

describe('rebooking reminder guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', SECRET);
    delete process.env.REBOOKING_REMINDERS_ENABLED;
    jobFindMany.mockResolvedValue([]);
    auditFindMany.mockResolvedValue([]);
    deliveryFindMany.mockResolvedValue([]);
    deliveryCreate.mockResolvedValue({});
    deliveryUpdateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects an unauthorized request while sending remains enabled', async () => {
    const response = await rebookingReminders(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(verifyCronAuth).toHaveBeenCalled();
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(jobCount).not.toHaveBeenCalled();
    expect(auditFindMany).not.toHaveBeenCalled();
    expect(deliveryFindMany).not.toHaveBeenCalled();
    expect(deliveryCreate).not.toHaveBeenCalled();
    expect(deliveryUpdateMany).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it('keeps the authorized empty run when the control is unset', async () => {
    const response = await rebookingReminders(request(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      unknown: 0,
    });
    expect(verifyCronAuth).toHaveBeenCalled();
    expect(deliveryUpdateMany).toHaveBeenCalled();
    expect(auditFindMany).toHaveBeenCalled();
    expect(jobFindMany).toHaveBeenCalledTimes(1);
    expect(deliveryCreate).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it.each(['false', '0', 'off', 'disabled', ' FALSE ', ' Off ', ' Disabled '])(
    'returns before auth, database, recovery, or sends when the control is %j',
    async (value) => {
      vi.stubEnv('REBOOKING_REMINDERS_ENABLED', value);

      const anonymous = await rebookingReminders(request());
      const authorized = await rebookingReminders(request(`Bearer ${SECRET}`));
      const wrong = await rebookingReminders(request('Bearer wrong-secret'));

      for (const response of [anonymous, authorized, wrong]) {
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          success: true,
          disabled: true,
          processed: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
        });
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
    }
  );
});
