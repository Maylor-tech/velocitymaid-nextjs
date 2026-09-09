import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@/lib/email/resendClient', () => ({
  getGuardedResend: () => ({ emails: { send: sendMock } }),
  getResendFromEmail: () => 'VelocityMaid <no-reply@velocitymaid.com>',
}));

import { sendCleanerOfferEmail } from '../sendCleanerOfferEmail';

const params = {
  cleanerEmail: 'real.cleaner@example.com',
  cleanerName: 'Test Cleaner',
  jobReference: 'VM-TEST-1',
  serviceType: 'Standard clean',
  scheduledDate: 'Sat, Oct 4',
  scheduledTime: '10:00 AM',
  locationLabel: 'Burlington',
  compensationAmount: 180,
  compensationCurrency: 'USD',
  compensationBasis: 'FLAT' as const,
  expiresAt: new Date('2026-10-03T16:00:00.000Z'),
  jobId: 'job-1',
  estimatedDurationMins: 180,
};

describe('sendCleanerOfferEmail outbound safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ data: { id: 'should-not-send' }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not call Resend when Preview has DISPATCH_NOTIFICATIONS=off', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DISPATCH_NOTIFICATIONS', 'off');
    vi.stubEnv('DISPATCH_NOTIFICATION_ALLOWLIST', 'real.cleaner@example.com');
    vi.stubEnv('NODE_ENV', 'test');

    const result = await sendCleanerOfferEmail(params);

    expect(result.sent).toBe(false);
    expect(result.error).toBe('staging_notifications_disabled');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not call Resend for a non-allowlisted Preview recipient', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DISPATCH_NOTIFICATIONS', 'on');
    vi.stubEnv('DISPATCH_NOTIFICATION_ALLOWLIST', 'staging.cleaner@example.test');
    vi.stubEnv('NODE_ENV', 'test');

    const result = await sendCleanerOfferEmail(params);

    expect(result.sent).toBe(false);
    expect(result.error).toBe('recipient_not_allowlisted');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
