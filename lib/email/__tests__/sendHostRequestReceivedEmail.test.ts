import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('../resendClient', () => ({
  resend: { emails: { send: (...a: unknown[]) => send(...a) } },
  getResendFromEmail: () => 'VelocityMaid <no-reply@velocitymaid.com>',
}));

import { sendHostRequestReceivedEmail } from '../sendHostRequestReceivedEmail';

describe('sendHostRequestReceivedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('captures Resend message id on success', async () => {
    send.mockResolvedValue({ data: { id: 're_123' }, error: null });
    const result = await sendHostRequestReceivedEmail({
      to: 'host@example.com',
      customerFirstName: 'Ray',
      address: '198 Chipman Park',
      preferredDate: new Date('2026-12-08T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceType: 'Property Walkthrough',
      jobReference: 'VM-2026-0029',
      jobId: 'job-1',
    });
    expect(result).toEqual({
      sent: true,
      provider: 'RESEND',
      messageId: 're_123',
    });
  });

  it('returns sent=false without throwing when Resend errors', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'rate limited' } });
    const result = await sendHostRequestReceivedEmail({
      to: 'host@example.com',
      customerFirstName: 'Ray',
      address: '198 Chipman Park',
      preferredDate: new Date('2026-12-08T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      serviceType: 'Property Walkthrough',
      jobReference: 'VM-2026-0029',
      jobId: 'job-1',
    });
    expect(result.sent).toBe(false);
    expect(result.skippedReason).toBe('rate limited');
    expect(result.messageId).toBeNull();
  });
});
