import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { jobFindMany, jobCount, auditFindMany, sendRebooking, logAudit } = vi.hoisted(() => ({
  jobFindMany: vi.fn(),
  jobCount: vi.fn(),
  auditFindMany: vi.fn(),
  sendRebooking: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findMany: jobFindMany, count: jobCount },
    auditLog: { findMany: auditFindMany },
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects an unauthorized request while sending remains enabled', async () => {
    const response = await rebookingReminders(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
  });

  it('keeps the existing authorized run when the control is unset', async () => {
    const response = await rebookingReminders(request(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
    });
    expect(jobFindMany).toHaveBeenCalledTimes(1);
    expect(sendRebooking).not.toHaveBeenCalled();
  });

  it('returns before queries or sends when explicitly disabled, with or without a secret', async () => {
    vi.stubEnv('REBOOKING_REMINDERS_ENABLED', 'false');

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
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(jobCount).not.toHaveBeenCalled();
    expect(auditFindMany).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });
});
