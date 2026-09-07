import { describe, expect, it } from 'vitest';
import {
  resolveSafeEmailRecipient,
  resolveSafeWhatsAppRecipient,
} from '../outboundSafety';

describe('outbound email safety', () => {
  it('blocks local development email unless allowlisted', () => {
    const d = resolveSafeEmailRecipient('brian@real-cleaner.com', {
      NODE_ENV: 'development',
    });
    expect(d.allowed).toBe(false);
  });

  it('allows the intended recipient in production', () => {
    const d = resolveSafeEmailRecipient('brian@real-cleaner.com', {
      VERCEL_ENV: 'production',
    });
    expect(d.allowed).toBe(true);
    expect(d.to).toBe('brian@real-cleaner.com');
    expect(d.reason).toBe('production');
  });

  it('blocks all Preview email when no allowlist is set', () => {
    const d = resolveSafeEmailRecipient('brian@real-cleaner.com', {
      VERCEL_ENV: 'preview',
    });
    expect(d.allowed).toBe(false);
    expect(d.to).toBeNull();
    expect(d.reason).toBe('staging_notifications_disabled');
  });

  it('blocks Preview recipients that are not on the allowlist', () => {
    const d = resolveSafeEmailRecipient('brian@real-cleaner.com', {
      VERCEL_ENV: 'preview',
      DISPATCH_NOTIFICATION_ALLOWLIST: 'staging.cleaner@example.test',
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('recipient_not_allowlisted');
  });

  it('allows only listed staging recipients', () => {
    const d = resolveSafeEmailRecipient('staging.cleaner@example.test', {
      DISPATCH_STAGING: 'true',
      DISPATCH_NOTIFICATION_ALLOWLIST: 'staging.cleaner@example.test',
    });
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe('allowlisted');
  });

  it('honors DISPATCH_NOTIFICATIONS=off even with an allowlist', () => {
    const d = resolveSafeEmailRecipient('staging.cleaner@example.test', {
      DISPATCH_STAGING: 'true',
      DISPATCH_NOTIFICATIONS: 'off',
      DISPATCH_NOTIFICATION_ALLOWLIST: 'staging.cleaner@example.test',
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('staging_notifications_disabled');
  });

  it('blocks Preview WhatsApp unless the number is allowlisted', () => {
    const blocked = resolveSafeWhatsAppRecipient('+18025550199', {
      VERCEL_ENV: 'preview',
    });
    expect(blocked.allowed).toBe(false);

    const allowed = resolveSafeWhatsAppRecipient('+18025550100', {
      DISPATCH_STAGING: 'true',
      DISPATCH_WHATSAPP_ALLOWLIST: '18025550100',
    });
    expect(allowed.allowed).toBe(true);
  });
});
