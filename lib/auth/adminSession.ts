import type { AdminSessionPayload } from './adminScope';

export const ADMIN_SESSION_MAX_AGE = 30 * 60;
const AUDIENCE = 'velocitymaid-admin-v1';

export interface AdminSignedSession extends AdminSessionPayload {
  isOwner: boolean;
  isBranchScoped: boolean;
  branchIds: string[];
  issuedAt: number;
  expiresAt: number;
  audience: typeof AUDIENCE;
}

export function adminSessionSecret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

function canonical(session: AdminSignedSession): string {
  return JSON.stringify({
    userId: session.userId,
    role: session.role,
    isOwner: session.isOwner,
    isBranchScoped: session.isBranchScoped,
    branchId: session.branchId,
    branchIds: session.branchIds,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    audience: session.audience,
  });
}

async function key(value: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(value),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function scopeMatches(session: AdminSignedSession): boolean {
  if (session.isOwner) {
    return session.isBranchScoped === false && session.branchId === undefined;
  }
  if (session.branchIds.length === 1) {
    return session.isBranchScoped === true && session.branchId === session.branchIds[0];
  }
  return session.isBranchScoped === false && session.branchId === undefined;
}

export async function signAdminSession(
  session: AdminSessionPayload & { isOwner: boolean; branchIds: string[] }
): Promise<string> {
  const signingSecret = adminSessionSecret();
  if (!signingSecret) throw new Error('Admin session is not configured');
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSignedSession = {
    ...session,
    isBranchScoped: session.isBranchScoped === true,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_MAX_AGE,
    audience: AUDIENCE,
  };
  if (!scopeMatches(payload)) throw new Error('Admin session scope is inconsistent');
  const mac = await crypto.subtle.sign(
    'HMAC',
    await key(signingSecret),
    new TextEncoder().encode(canonical(payload))
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return JSON.stringify({ ...payload, signature });
}

export async function verifyAdminSession(
  raw: string | undefined
): Promise<AdminSignedSession | null> {
  const signingSecret = adminSessionSecret();
  if (!raw || raw === 'true' || raw.length > 4096 || !signingSecret) return null;
  try {
    const parsed = JSON.parse(raw);
    const { signature, ...payload } = parsed;
    const session = payload as AdminSignedSession;
    const now = Math.floor(Date.now() / 1000);
    const permitted = [
      'userId', 'role', 'isOwner', 'isBranchScoped', 'branchId', 'branchIds',
      'issuedAt', 'expiresAt', 'audience',
    ];
    if (
      Object.keys(payload).some((name) => !permitted.includes(name)) ||
      typeof session.userId !== 'string' || !session.userId ||
      session.role !== 'ADMIN' ||
      typeof session.isOwner !== 'boolean' ||
      typeof session.isBranchScoped !== 'boolean' ||
      !Array.isArray(session.branchIds) || !session.branchIds.length ||
      session.branchIds.some((id) => typeof id !== 'string' || !id) ||
      new Set(session.branchIds).size !== session.branchIds.length ||
      !scopeMatches(session) ||
      session.audience !== AUDIENCE ||
      !Number.isSafeInteger(session.issuedAt) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.issuedAt > now ||
      session.expiresAt <= now ||
      session.expiresAt - session.issuedAt !== ADMIN_SESSION_MAX_AGE ||
      typeof signature !== 'string'
    ) {
      return null;
    }
    const bytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC',
      await key(signingSecret),
      bytes,
      new TextEncoder().encode(canonical(session))
    );
    return valid ? session : null;
  } catch {
    return null;
  }
}
