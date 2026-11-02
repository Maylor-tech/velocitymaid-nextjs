import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  PREVIEW_ADMIN_EMAIL, PREVIEW_ADMIN_MAX_AGE, signPreviewAdminSession,
} from './previewAdminSession';

const failure = (status: number) => NextResponse.json(
  { success: false, error: status === 503 ? 'Preview administrator login is not configured' : 'Invalid credentials' },
  { status, headers: { 'Cache-Control': 'no-store' } },
);

/** Preview only. No account/branch writes and no mail/provider calls. */
export async function previewAdminLogin(req: NextRequest): Promise<NextResponse> {
  if (process.env.VERCEL_ENV !== 'preview') return new NextResponse(null, { status: 404 });
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin) return failure(403);
    const { email, password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD_STAGING_ADMIN_EXAMPLE_TEST;
    const signingSecret = process.env.PREVIEW_ADMIN_SESSION_SECRET;
    if (!expected || expected.length < 16 || !signingSecret || signingSecret.length < 32) return failure(503);
    if (typeof email !== 'string' || email.trim().toLowerCase() !== PREVIEW_ADMIN_EMAIL ||
        typeof password !== 'string' || password.length > 1024) return failure(401);
    const digest = (s: string) => createHash('sha256').update(s).digest();
    if (!timingSafeEqual(digest(password), digest(expected))) return failure(401);
    const user = await prisma.user.findUnique({
      where: { email: PREVIEW_ADMIN_EMAIL },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || user.role !== 'ADMIN' || !user.isActive) return failure(401);
    const branches = await prisma.userBranch.findMany({
      where: { userId: user.id }, select: { branchId: true },
    });
    if (!branches.length) return failure(403);
    const branchIds = branches.map(b => b.branchId).sort();
    const isBranchScoped = branchIds.length === 1;
    const token = await signPreviewAdminSession({
      userId: user.id, role: 'ADMIN', branchIds, isBranchScoped,
      ...(isBranchScoped ? { branchId: branchIds[0] } : {}),
    });
    const store = await cookies();
    store.set('admin_session', token, {
      httpOnly: true, secure: true, sameSite: 'strict', path: '/',
      maxAge: PREVIEW_ADMIN_MAX_AGE,
    });
    return NextResponse.json({ success: true, previewDiagnostic: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Never log request credentials, session tokens, database URLs or error objects.
    return failure(503);
  }
}
