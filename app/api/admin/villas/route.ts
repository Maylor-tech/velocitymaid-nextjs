export const dynamic = 'force-dynamic'
/**
 * Admin Villa CRM API
 * GET /api/admin/villas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const orderBy: any = {};
    if (sortBy === 'bedrooms') {
      orderBy.bedrooms = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    }

    const applications = await prisma.villaPartnerApplication.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Get villa applications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

