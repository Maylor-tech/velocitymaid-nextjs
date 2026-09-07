/**
 * Outbound notification safety. Staging/Preview must not reach real people
 * unless the recipient is on an explicit allowlist. Callers should not
 * rely on remembering to skip send.
 */

export type OutboundSafetyReason =
  | 'production'
  | 'allowlisted'
  | 'staging_notifications_disabled'
  | 'recipient_not_allowlisted'
  | 'missing_recipient';

export type OutboundEmailDecision = {
  allowed: boolean;
  to: string | null;
  reason: OutboundSafetyReason;
};

export type OutboundWhatsAppDecision = {
  allowed: boolean;
  to: string | null;
  reason: OutboundSafetyReason;
};

function parseEmailAllowlist(env: Record<string, string | undefined>): string[] {
  return (env.DISPATCH_NOTIFICATION_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parsePhoneAllowlist(env: Record<string, string | undefined>): string[] {
  return (env.DISPATCH_WHATSAPP_ALLOWLIST || '')
    .split(',')
    .map((s) => s.replace(/\D/g, ''))
    .filter(Boolean);
}

export function isNonProductionRuntime(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.DISPATCH_STAGING === 'true') return true;
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development') return true;
  if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') return true;
  return false;
}

export function areOutboundNotificationsDisabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.DISPATCH_NOTIFICATIONS === 'off';
}

export function resolveSafeEmailRecipient(
  intended: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): OutboundEmailDecision {
  const raw = intended?.trim() || '';
  if (!raw) {
    return { allowed: false, to: null, reason: 'missing_recipient' };
  }

  if (!isNonProductionRuntime(env)) {
    return { allowed: true, to: raw, reason: 'production' };
  }

  if (areOutboundNotificationsDisabled(env)) {
    return { allowed: false, to: null, reason: 'staging_notifications_disabled' };
  }

  const allowlist = parseEmailAllowlist(env);
  if (allowlist.length === 0) {
    return { allowed: false, to: null, reason: 'staging_notifications_disabled' };
  }

  if (!allowlist.includes(raw.toLowerCase())) {
    return { allowed: false, to: null, reason: 'recipient_not_allowlisted' };
  }

  return { allowed: true, to: raw, reason: 'allowlisted' };
}

export function filterOutboundEmailTo(
  to: string | string[],
  env: Record<string, string | undefined> = process.env
): { allowed: boolean; to: string | string[] | null; reason: OutboundSafetyReason } {
  const list = Array.isArray(to) ? to : [to];
  const kept: string[] = [];
  let reason: OutboundSafetyReason = 'missing_recipient';
  for (const addr of list) {
    const decision = resolveSafeEmailRecipient(addr, env);
    reason = decision.reason;
    if (decision.allowed && decision.to) kept.push(decision.to);
  }
  if (kept.length === 0) {
    return { allowed: false, to: null, reason };
  }
  return {
    allowed: true,
    to: Array.isArray(to) ? kept : kept[0],
    reason,
  };
}

export function resolveSafeWhatsAppRecipient(
  intended: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): OutboundWhatsAppDecision {
  const raw = intended?.trim() || '';
  if (!raw) {
    return { allowed: false, to: null, reason: 'missing_recipient' };
  }

  if (!isNonProductionRuntime(env)) {
    return { allowed: true, to: raw, reason: 'production' };
  }

  if (areOutboundNotificationsDisabled(env)) {
    return { allowed: false, to: null, reason: 'staging_notifications_disabled' };
  }

  const allowlist = parsePhoneAllowlist(env);
  if (allowlist.length === 0) {
    return { allowed: false, to: null, reason: 'staging_notifications_disabled' };
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits || !allowlist.includes(digits)) {
    return { allowed: false, to: null, reason: 'recipient_not_allowlisted' };
  }

  return { allowed: true, to: raw, reason: 'allowlisted' };
}
