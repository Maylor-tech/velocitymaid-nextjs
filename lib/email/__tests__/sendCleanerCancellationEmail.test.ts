import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@/lib/email/resendClient', () => ({
  getGuardedResend: () => ({ emails: { send: sendMock } }),
  getResendFromEmail: () => 'VelocityMaid <no-reply@velocitymaid.com>',
}));

import { sendCleanerCancellationEmail } from '../sendCleanerCancellationEmail';

const params = {
  cleanerEmail: 'real.cleaner@example.com',
  cleanerName: 'Dorottya',
  jobReference: 'VM-2026-0028',
  serviceType: 'Turnover clean',
  scheduledDate: 'Sat, Oct 4',
  scheduledTime: '10:00 AM',
  locationLabel: 'Ludlow',
  jobId: 'job-oct4',
};

describe('sendCleanerCancellationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends branded cancellation copy without sensitive fields or compensation', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DISPATCH_STAGING', '');
    vi.stubEnv('DISPATCH_NOTIFICATIONS', '');

    const result = await sendCleanerCancellationEmail(params);

    expect(result.sent).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toBe('Job cancelled — Turnover clean on Sat, Oct 4');
    expect(payload.html).toContain('VM-2026-0028');
    expect(payload.html).toContain('Turnover clean');
    expect(payload.html).toContain('Sat, Oct 4');
    expect(payload.html).toContain('10:00 AM');
    expect(payload.html).toContain('Ludlow');
    expect(payload.html).toContain('No service is required for this job');
    expect(payload.html).toContain('removed from your active work in the cleaner portal');
    expect(payload.text).toContain('Job: VM-2026-0028');

    const combined = `${payload.html}\n${payload.text}\n${payload.subject}`;
    expect(combined).not.toMatch(/accessNotes|alarm|gate code|lockbox|\$265|invoice|payout|compensation|Your pay/i);
  });

  it('does not call Resend when Preview has DISPATCH_NOTIFICATIONS=off', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DISPATCH_NOTIFICATIONS', 'off');
    vi.stubEnv('DISPATCH_NOTIFICATION_ALLOWLIST', 'real.cleaner@example.com');
    vi.stubEnv('NODE_ENV', 'test');

    const result = await sendCleanerCancellationEmail(params);

    expect(result.sent).toBe(false);
    expect(result.error).toBe('staging_notifications_disabled');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not call Resend for a non-allowlisted Preview recipient', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DISPATCH_NOTIFICATIONS', 'on');
    vi.stubEnv('DISPATCH_NOTIFICATION_ALLOWLIST', 'staging.cleaner@example.test');
    vi.stubEnv('NODE_ENV', 'test');

    const result = await sendCleanerCancellationEmail(params);

    expect(result.sent).toBe(false);
    expect(result.error).toBe('recipient_not_allowlisted');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
