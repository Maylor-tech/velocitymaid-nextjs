import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendVerifiedEmail = vi.hoisted(() => vi.fn());

vi.mock('@/lib/email/sendVerifiedEmail', () => ({
  EmailDeliveryError: class EmailDeliveryError extends Error {
    constructor(message: string, public readonly deliveryUnknown: boolean) {
      super(message);
    }
  },
  sendVerifiedEmail,
}));
vi.mock('@/lib/email/resendClient', () => ({
  resend: { emails: { send: vi.fn() } },
  getResendFromEmail: () => 'VelocityMaid <hello@velocitymaid.com>',
}));
vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: vi.fn(() => Promise.resolve()),
}));

import { EmailDeliveryError } from '@/lib/email/sendVerifiedEmail';
import { sendReviewRequestEmail } from '@/lib/email/sendReviewRequestEmail';

describe('review request email provider result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the stable idempotency key and returns the provider message id', async () => {
    sendVerifiedEmail.mockResolvedValue({ messageId: 'email-1' });

    const result = await sendReviewRequestEmail({
      toEmail: 'guest@example.com',
      toName: 'Guest',
      reviewUrl: 'https://example.com/review',
      idempotencyKey: 'review-request-rr-1',
    });

    expect(result).toEqual({ sent: true, id: 'email-1' });
    expect(sendVerifiedEmail.mock.calls[0][1]).toBe('review-request-rr-1');
  });

  it('marks a timeout as an unknown outcome instead of a safe retry', async () => {
    sendVerifiedEmail.mockRejectedValue(new EmailDeliveryError('timeout', true));

    await expect(
      sendReviewRequestEmail({
        toEmail: 'guest@example.com',
        toName: 'Guest',
        reviewUrl: 'https://example.com/review',
      })
    ).resolves.toMatchObject({ sent: false, outcomeUnknown: true });
  });

  it('marks a provider rejection as a definite failure', async () => {
    sendVerifiedEmail.mockRejectedValue(new EmailDeliveryError('rejected', false));

    await expect(
      sendReviewRequestEmail({
        toEmail: 'guest@example.com',
        toName: 'Guest',
        reviewUrl: 'https://example.com/review',
      })
    ).resolves.toMatchObject({ sent: false, outcomeUnknown: false });
  });
});
