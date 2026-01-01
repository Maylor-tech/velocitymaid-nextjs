export const runtime = 'nodejs';
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

    // Phase 1: Gate cleaner dashboard by approval status
    // If cleaner is a User with role CLEANER, they were created from an approved application
    // But we should verify they have an approved application
    const approvedApplication = await prisma.cleanerApplication.findFirst({
      where: {
        email: cleaner.email,
        status: 'APPROVED',
      },
    });

    // If no approved application found, check status of any application
    if (!approvedApplication) {
      const anyApplication = await prisma.cleanerApplication.findFirst({
        where: {
          email: cleaner.email,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (anyApplication && anyApplication.status !== 'APPROVED') {
        return NextResponse.json(
          { 
            success: false, 
            error: anyApplication.status === 'PENDING' 
              ? 'Your application is pending approval. You will be notified once it is reviewed.'
              : 'Your application was not approved. Please contact support if you believe this is an error.',
            applicationStatus: anyApplication.status,
          },
          { status: 403 }
        );
      }
      
      // If cleaner is a User but no application found, allow access (edge case - User created manually)
      // This maintains backward compatibility
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




