import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  getScopedAdminPassword,
  isBranchScopedAdmin,
  isOwnerAdmin,
} from '@/lib/auth/adminScope';
import { ADMIN_SESSION_MAX_AGE, adminSessionSecret, signAdminSession } from '@/lib/auth/adminSession';
import { clearLegacyAdminCookies } from '@/lib/auth/legacyAdminCookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function failure(status: number) {
  const error = status === 503
    ? 'Admin login is not configured'
    : status === 403
      ? 'No branch access assigned'
      : 'Invalid email or password';
  try {
    clearLegacyAdminCookies(await cookies());
  } catch {
    // The response still refuses the login.
  }
  return NextResponse.json(
    { success: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function passwordsMatch(provided: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin) return await failure(403);
    const body = await req.json();
    const email = body?.email;
    const password = body?.password;
    if (typeof email !== 'string' || !email.trim()) return await failure(401);
    const normalizedEmail = email.trim().toLowerCase();
    if (!adminSessionSecret()) return await failure(503);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || user.role !== UserRole.ADMIN || !user.isActive) return await failure(401);

    const expectedPassword = getScopedAdminPassword(normalizedEmail);
    if (!expectedPassword || expectedPassword.length < 16) return await failure(503);
    if (typeof password !== 'string' || password.length === 0 || password.length > 1024) return await failure(401);
    if (!passwordsMatch(password, expectedPassword)) return await failure(401);

    const branches = await prisma.userBranch.findMany({
      where: { userId: user.id },
      select: { branchId: true },
    });
    if (branches.length === 0) return await failure(403);

    const branchIds = branches.map((branch) => branch.branchId).sort();
    const isOwner = isOwnerAdmin(user.email);
    const isBranchScoped = isBranchScopedAdmin(user.email, branchIds.length);
    const token = await signAdminSession({
      userId: user.id,
      role: 'ADMIN',
      isOwner,
      branchIds,
      isBranchScoped,
      ...(isBranchScoped ? { branchId: branchIds[0] } : {}),
    });
    const cookieStore = await cookies();
    clearLegacyAdminCookies(cookieStore);
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return await failure(503);
  }
}
