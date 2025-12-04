export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    const where = role ? { role: role as any } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}



