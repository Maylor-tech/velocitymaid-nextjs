import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { safeError } from '@/lib/safeError';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check that user exists and has ADMIN role (e.g. created via scripts/createAdmin.ts)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 401 }
      );
    }

    const branches = await prisma.userBranch.findMany({
      where: { userId: user.id },
      include: { branch: true },
    });

    if (branches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No branch access assigned' },
        { status: 403 }
      );
    }

    const session = {
      userId: user.id,
      role: user.role,
      branchId: branches[0].branchId,
    };

    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[ADMIN LOGIN] Error:', error);
    return NextResponse.json(
      { success: false, error: safeError() },
      { status: 500 }
    );
  }
}

