import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('../resendClient', () => ({
  resend: { emails: { send } },
  getResendFromEmail: () => 'VelocityMaid <notify@example.com>',
}));
vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: vi.fn(async () => undefined),
}));

import {
  formatRebookingCheckoutDateUtc,
  sendRebookingReminderEmail,
} from '../cronAutomationEmails';

const params = {
  toEmail: 'host@example.com',
  hostFirstName: 'Alex',
  propertyAddress: '1 Main St',
  checkoutDate: new Date('2026-09-11T02:00:00.000Z'),
  idempotencyKey: 'rebooking-reminder-job-1',
};

describe('rebooking reminder email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints the checkout calendar date in UTC', () => {
    expect(formatRebookingCheckoutDateUtc(params.checkoutDate)).toBe('September 11, 2026');
    expect(formatRebookingCheckoutDateUtc(new Date('2026-09-11T00:00:00.000Z'))).toBe(
      'September 11, 2026'
    );
  });

  it('sends through the verified client with a stable idempotency key', async () => {
    send.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    await expect(sendRebookingReminderEmail(params)).resolves.toEqual({
      sent: true,
      id: 'msg-1',
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].text).toContain('September 11, 2026');
    expect(send.mock.calls[0][1]).toEqual({ idempotencyKey: 'rebooking-reminder-job-1' });
  });

  it('reports 408, 409, and 5xx results as unknown', async () => {
    for (const statusCode of [408, 409, 500, 503]) {
      send.mockResolvedValueOnce({
        data: null,
        error: { statusCode, message: `status ${statusCode}` },
      });
      await expect(sendRebookingReminderEmail(params)).resolves.toMatchObject({
        sent: false,
        outcomeUnknown: true,
      });
    }
  });

  it('reports a missing message id and a thrown timeout as unknown', async () => {
    send.mockResolvedValueOnce({ data: {}, error: null });
    await expect(sendRebookingReminderEmail(params)).resolves.toMatchObject({
      sent: false,
      outcomeUnknown: true,
    });

    send.mockRejectedValueOnce(new Error('timeout'));
    const timeout = await sendRebookingReminderEmail(params);
    expect(timeout.outcomeUnknown).toBe(true);
    expect(timeout.sent).toBe(false);
  });

  it('reports a definite provider rejection as retryable', async () => {
    send.mockResolvedValue({ data: null, error: { statusCode: 422, message: 'invalid email' } });
    await expect(sendRebookingReminderEmail(params)).resolves.toMatchObject({
      sent: false,
      outcomeUnknown: false,
      error: 'invalid email',
    });
  });
});
