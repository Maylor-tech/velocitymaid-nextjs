export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getBranchBySlug } from '@/utils/branchData';
import { findUserById, createUserBranch, getUserBranches, updateUser } from '@/utils/userData';
import { isCleanerTrainingEligible } from '@/utils/trainingEligibility';
import { prisma } from '@/lib/prisma';

/**
 * Assign Cleaner to Branch API
 * 
 * POST /api/admin/branches/[slug]/assign-cleaner
 * 
 * Body: { userId: string, setAsPrimary?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const body = await request.json();
    const { userId, setAsPrimary = false } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const branch = getBranchBySlug(slug);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Check if branch is Jamaica - if so, verify training
    const isJamaicaBranch = branch.country === 'Jamaica' || branch.country === 'JM' || branch.slug === 'port-antonio';
    
    if (isJamaicaBranch) {
      // Use Prisma to check training status
      const cleanerUser = await prisma.user.findUnique({
        where: { id: userId, role: 'CLEANER' },
      });

      if (cleanerUser) {
        const eligibility = await isCleanerTrainingEligible(userId);
        if (!eligibility.eligible) {
          return NextResponse.json(
            {
              success: false,
              error: eligibility.reason || 'Training not completed',
              trainingRequired: true,
            },
            { status: 403 }
          );
        }
      }
    }

    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existingAssignments = getUserBranches(userId);
    const alreadyAssigned = existingAssignments.some(ub => ub.branchId === branch.id);

    if (alreadyAssigned) {
      return NextResponse.json(
        { success: false, error: 'User is already assigned to this branch' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = createUserBranch({
      userId,
      branchId: branch.id,
    });

    // Set as primary branch if requested
    if (setAsPrimary) {
      updateUser(userId, { primaryBranchId: branch.id });
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        branchId: assignment.branchId,
        branchSlug: branch.slug,
        branchName: branch.name,
      },
    });
  } catch (error: any) {
    console.error('Assign cleaner error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign cleaner' },
      { status: 500 }
    );
  }
}

/**
 * Remove Cleaner from Branch API
 * 
 * DELETE /api/admin/branches/[slug]/assign-cleaner?userId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const branch = getBranchBySlug(slug);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // TODO: Implement removal when we have delete function
    // For now, return success (mock implementation)
    return NextResponse.json({
      success: true,
      message: 'Cleaner removed from branch',
    });
  } catch (error: any) {
    console.error('Remove cleaner error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove cleaner' },
      { status: 500 }
    );
  }
}

/**
 * List Cleaners for Branch API
 * 
 * GET /api/admin/branches/[slug]/assign-cleaner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;

    const branch = getBranchBySlug(slug);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Get all users assigned to this branch
    const { getUserBranches, findUserById, getUsersByRole } = await import('@/utils/userData');
    const allCleaners = getUsersByRole('CLEANER');
    
    const branchCleaners = allCleaners
      .filter(cleaner => {
        const assignments = getUserBranches(cleaner.id);
        return assignments.some(ub => ub.branchId === branch.id);
      })
      .map(cleaner => ({
        id: cleaner.id,
        name: cleaner.name,
        email: cleaner.email,
        primaryBranchId: cleaner.primaryBranchId,
        isPrimary: cleaner.primaryBranchId === branch.id,
      }));

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        slug: branch.slug,
        name: branch.name,
      },
      cleaners: branchCleaners,
      count: branchCleaners.length,
    });
  } catch (error: any) {
    console.error('List cleaners error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list cleaners' },
      { status: 500 }
    );
  }
}



