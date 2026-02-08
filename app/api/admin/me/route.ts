import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/me
 * Returns current admin user and branch scope for UI (welcome banner, branch selector lock).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, 'ADMIN');

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let branchName: string | null = null;
    if (auth.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: auth.branchId },
        select: { name: true },
      });
      branchName = branch?.name ?? null;
    }

    return NextResponse.json({
      success: true,
      name: user.name ?? undefined,
      email: user.email,
      branchId: auth.branchId ?? undefined,
      branchName: branchName ?? undefined,
      isBranchScoped: !!auth.branchId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Unauthorized' },
      { status: 401 }
    );
  }
}
