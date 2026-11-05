import type { AdminSessionPayload } from './adminScope';

export const PREVIEW_ADMIN_EMAIL = 'staging.admin@example.test';
export const PREVIEW_ADMIN_MAX_AGE = 30 * 60;
export const isPreviewAdminRuntime = () => process.env.VERCEL_ENV === 'preview';

export interface PreviewAdminSession extends AdminSessionPayload {
  branchIds: string[];
  issuedAt: number;
  expiresAt: number;
  audience: 'velocitymaid-preview-admin-v1';
}

function secret(): string | null {
  const value = process.env.PREVIEW_ADMIN_SESSION_SECRET;
  return isPreviewAdminRuntime() && value && value.length >= 32 ? value : null;
}

function canonical(s: PreviewAdminSession): string {
  return JSON.stringify({
    userId: s.userId, role: s.role, isBranchScoped: s.isBranchScoped,
    branchId: s.branchId, branchIds: s.branchIds,
    issuedAt: s.issuedAt, expiresAt: s.expiresAt, audience: s.audience,
  });
}

async function key(value: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(value),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signPreviewAdminSession(
  session: AdminSessionPayload & { branchIds: string[] },
): Promise<string> {
  const signingSecret = secret();
  if (!signingSecret) throw new Error('Preview administrator session is not configured');
  const now = Math.floor(Date.now() / 1000);
  const payload: PreviewAdminSession = {
    ...session, issuedAt: now, expiresAt: now + PREVIEW_ADMIN_MAX_AGE,
    audience: 'velocitymaid-preview-admin-v1',
  };
  const mac = await crypto.subtle.sign('HMAC', await key(signingSecret),
    new TextEncoder().encode(canonical(payload)));
  const signature = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return JSON.stringify({ ...payload, signature });
}

export async function verifyPreviewAdminSession(
  raw: string | undefined,
): Promise<PreviewAdminSession | null> {
  const signingSecret = secret();
  if (!raw || raw.length > 4096 || !signingSecret) return null;
  try {
    const parsed = JSON.parse(raw);
    const { signature, ...payload } = parsed;
    const s = payload as PreviewAdminSession;
    const now = Math.floor(Date.now() / 1000);
    const permitted = ['userId', 'role', 'isBranchScoped', 'branchId', 'branchIds',
      'issuedAt', 'expiresAt', 'audience'];
    if (Object.keys(payload).some(k => !permitted.includes(k)) ||
        typeof s.userId !== 'string' || !s.userId || s.role !== 'ADMIN' ||
        typeof s.isBranchScoped !== 'boolean' ||
        !Array.isArray(s.branchIds) || !s.branchIds.length ||
        s.branchIds.some(id => typeof id !== 'string' || !id) ||
        new Set(s.branchIds).size !== s.branchIds.length ||
        (s.isBranchScoped ? typeof s.branchId !== 'string' || s.branchIds.length !== 1 ||
          s.branchId !== s.branchIds[0] : s.branchId !== undefined) ||
        s.audience !== 'velocitymaid-preview-admin-v1' ||
        !Number.isSafeInteger(s.issuedAt) || !Number.isSafeInteger(s.expiresAt) ||
        s.issuedAt > now || s.expiresAt <= now ||
        s.expiresAt - s.issuedAt !== PREVIEW_ADMIN_MAX_AGE ||
        typeof signature !== 'string') return null;
    const bytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', await key(signingSecret), bytes,
      new TextEncoder().encode(canonical(s)));
    return valid ? s : null;
  } catch {
    return null;
  }
}
