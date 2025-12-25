export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { prisma } from '@/lib/prisma';

/**
 * Get Current Cleaner Info
 * 
 * GET /api/cleaners/me
 * 
 * Returns: { success: true, cleaner: { id, name, email, branchId, branchName, branchSlug, ... } }
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedCleaner(request);

    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch cleaner with branch information from database
    const cleaner = await prisma.user.findUnique({
      where: {
        id: authResult.cleanerId,
      },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        UserBranch: {
          include: {
            Branch: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Determine primary branch (first from primaryBranchId, then from UserBranch)
    const primaryBranch = cleaner.Branch_User_primaryBranchIdToBranch || 
                          cleaner.UserBranch[0]?.Branch || 
                          null;

    // Get all assigned branches
    const assignedBranches = cleaner.UserBranch.map(ub => ub.Branch);
    if (primaryBranch && !assignedBranches.find(b => b.id === primaryBranch.id)) {
      assignedBranches.unshift(primaryBranch);
    }

    return NextResponse.json({
      success: true,
      cleaner: {
        id: cleaner.id,
        name: cleaner.name,
        email: cleaner.email,
        branchId: primaryBranch?.id || null,
        branchName: primaryBranch?.name || null,
        branchSlug: primaryBranch?.slug || null,
        primaryBranchId: cleaner.primaryBranchId,
        assignedBranches: assignedBranches.map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get cleaner info error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get cleaner info' },
      { status: 500 }
    );
  }
}




