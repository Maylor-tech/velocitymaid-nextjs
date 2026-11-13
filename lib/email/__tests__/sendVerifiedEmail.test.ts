import { beforeEach, describe, expect, it, vi } from 'vitest';
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../resendClient', () => ({ resend: { emails: { send } } }));
import { sendVerifiedEmail, EmailDeliveryError } from '../sendVerifiedEmail';
const payload = { from: 'test@example.com', to: 'internal@example.com', subject: 'Test', text: 'Offline test' };

describe('provider acceptance verification', () => {
  beforeEach(() => vi.clearAllMocks());
  it('records a provider message ID and passes the idempotency key', async () => {
    send.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    expect(await sendVerifiedEmail(payload, 'stable-key')).toEqual({ messageId: 'msg-1' });
    expect(send).toHaveBeenCalledWith(payload, { idempotencyKey: 'stable-key' });
  });
  it('rejects resolved provider errors (including preview outbound blocks)', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'outbound_blocked:recipient_not_allowlisted', statusCode: 0 } });
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: false });
  });
  it('marks timeouts unknown rather than safe to retry', async () => {
    send.mockRejectedValue(new Error('timeout'));
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: true });
  });
  it('requires a message ID even when no provider error is returned', async () => {
    send.mockResolvedValue({ data: null, error: null });
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({
      deliveryUnknown: true,
    });
    expect(EmailDeliveryError).toBeTruthy();
  });
  it('parks 408, 409, and 5xx responses as uncertain', async () => {
    for (const statusCode of [408, 409, 500]) {
      send.mockResolvedValueOnce({ data: null, error: { statusCode, message: `status ${statusCode}` } });
      await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: true });
    }
  });
  it('recognizes SDK-resolved network errors and server errors as uncertain', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'application_error', statusCode: null, message: 'Unable to fetch data' } });
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: true });
    send.mockResolvedValue({ data: null, error: { statusCode: 503, message: 'unavailable' } });
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: true });
  });
  it('treats explicit validation rejection as not accepted', async () => {
    send.mockResolvedValue({ data: null, error: { statusCode: 422, message: 'invalid email' } });
    await expect(sendVerifiedEmail(payload)).rejects.toMatchObject({ deliveryUnknown: false });
  });
});
