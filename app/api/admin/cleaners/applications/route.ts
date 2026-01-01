export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const applications = await prisma.cleanerApplication.findMany({
      where,
      include: {
        Branch: {
          select: { id: true, name: true, slug: true, city: true, state: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error: any) {
    console.error('List cleaner applications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}



