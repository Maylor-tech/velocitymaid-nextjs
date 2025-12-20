export const dynamic = 'force-dynamic'

/**
 * Admin Contracts API
 * GET /api/admin/contracts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (branch && branch !== 'all') {
      where.branch = branch;
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      contracts,
      count: contracts.length,
    });
  } catch (error: any) {
    console.error('Get contracts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

