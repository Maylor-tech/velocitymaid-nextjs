export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';

/**
 * List Branches API (Phase 0 - Public)
 * 
 * GET /api/branches
 * 
 * Returns active branches for Phase 0 use (booking, cleaner application)
 * This is a Phase 0 route - no admin authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const branches = await prisma.branch.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'COMING_SOON']
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        country: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      branches,
      count: branches.length,
    });
  } catch (error: any) {
    console.error('BRANCH_FETCH_ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

