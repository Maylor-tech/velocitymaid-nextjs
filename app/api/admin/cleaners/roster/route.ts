export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const branchId = auth.branchId ?? request.nextUrl.searchParams.get('branchId') ?? undefined;

    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        ...(branchId ? { primaryBranchId: branchId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        primaryBranchId: true,
        CleanerProfile: {
          select: {
            publicDisplayName: true,
            jobTitle: true,
            memberStatus: true,
            certificationLabel: true,
            isInternalTeam: true,
          },
        },
        Branch_User_primaryBranchIdToBranch: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      cleaners: cleaners.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        publicDisplayName: c.CleanerProfile?.publicDisplayName ?? null,
        jobTitle: c.CleanerProfile?.jobTitle ?? null,
        memberStatus: c.CleanerProfile?.memberStatus ?? (c.isActive ? 'ACTIVE' : 'INACTIVE'),
        certificationLabel: c.CleanerProfile?.certificationLabel ?? 'PENDING',
        isInternalTeam: c.CleanerProfile?.isInternalTeam ?? false,
        branchName: c.Branch_User_primaryBranchIdToBranch?.name ?? null,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load roster';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
