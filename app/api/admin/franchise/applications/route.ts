export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: Prisma.FranchiseApplicationWhereInput = {};
    if (status) {
      where.status = status as Prisma.FranchiseApplicationWhereInput["status"];
    }

    const applications = await prisma.franchiseApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('List franchise applications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
