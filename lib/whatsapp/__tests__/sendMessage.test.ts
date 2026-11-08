import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe('WhatsApp provider outcomes', () => {
  it('skips when credentials are missing and does not call the provider', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;

    await expect(sendWhatsAppMessage({ to: '+15551212', message: 'hello' })).resolves.toEqual({
      status: 'skipped',
      reason: 'whatsapp_not_configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a recipient that preview safety does not allow', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15559999');

    const result = await sendWhatsAppMessage({ to: '+15551212', message: 'hello' });

    expect(result).toEqual({ status: 'skipped', reason: 'recipient_not_allowlisted' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain('test-token');
  });

  it('returns accepted only when the provider responds with a message id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'wamid.accepted' }] }),
    });
    global.fetch = fetchMock;
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15551212');

    await expect(sendWhatsAppMessage({ to: '+1 (555) 1212', message: 'hello' })).resolves.toEqual({
      status: 'accepted',
      providerMessageId: 'wamid.accepted',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.to).toBe('15551212');
  });

  it('returns failed when the provider rejects the message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'invalid number' } }),
    });
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15551212');

    await expect(sendWhatsAppMessage({ to: '15551212', message: 'hello' })).resolves.toEqual({
      status: 'failed',
      reason: 'invalid number',
    });
  });

  it('holds a network failure as unknown because the provider may have accepted it', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15551212');

    await expect(sendWhatsAppMessage({ to: '15551212', message: 'hello' })).resolves.toEqual({
      status: 'unknown',
      reason: 'provider_unreachable',
    });
  });

  it('holds a successful response that has no message id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [] }),
    });
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15551212');

    await expect(sendWhatsAppMessage({ to: '15551212', message: 'hello' })).resolves.toEqual({
      status: 'unknown',
      reason: 'provider_missing_message_id',
    });
  });

  it('holds a server error instead of treating it as a rejection', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'unavailable' } }),
    });
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-1');
    vi.stubEnv('DISPATCH_WHATSAPP_ALLOWLIST', '15551212');

    await expect(sendWhatsAppMessage({ to: '15551212', message: 'hello' })).resolves.toEqual({
      status: 'unknown',
      reason: 'unavailable',
    });
  });
});
