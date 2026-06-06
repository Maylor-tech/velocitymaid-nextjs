export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveCityFromZip } from '@/utils/cityRouting';

/**
 * Resolve ZIP Code / Routing Code API
 * 
 * GET /api/resolve-zip?zip=XXXXX
 * 
 * Returns branch slug for the given ZIP code or routing code
 * Supports:
 * - U.S. ZIP codes (07102, 05149, etc.)
 * - Jamaica routing codes (PA-100, PA-101, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zip = searchParams.get('zip');

    if (!zip) {
      return NextResponse.json(
        { success: false, error: 'ZIP code or routing code is required' },
        { status: 400 }
      );
    }

    const normalizedZip = zip.trim().toUpperCase();

    // Special handling for Jamaica routing codes (PA-XXX)
    if (normalizedZip.startsWith('PA-')) {
      // Find Port Antonio branch by routing code
      const serviceArea = await prisma.branchServiceArea.findFirst({
        where: {
          zipCode: normalizedZip,
          branch: {
            slug: 'port-antonio',
            status: {
              in: ['ACTIVE', 'COMING_SOON'], // Allow COMING_SOON for Port Antonio
            },
          },
        },
        include: {
          branch: {
            select: {
              slug: true,
              status: true,
            },
          },
        },
        orderBy: {
          priority: 'asc',
        },
      });

      if (serviceArea && serviceArea.branch) {
        return NextResponse.json({
          success: true,
          branchSlug: serviceArea.branch.slug,
        });
      }
    }

    // Standard ZIP code lookup for U.S. branches
    const serviceArea = await prisma.branchServiceArea.findFirst({
      where: {
        zipCode: normalizedZip,
        branch: {
          status: 'ACTIVE', // Only active branches for U.S. ZIP codes
        },
      },
      include: {
        branch: {
          select: {
            slug: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (serviceArea && serviceArea.branch) {
      // Determine sub-city for New Jersey
      let assignedCity: string | null = null;
      if (serviceArea.branch.slug === 'new-jersey') {
        assignedCity = resolveCityFromZip(normalizedZip);
      }

      return NextResponse.json({
        success: true,
        branchSlug: serviceArea.branch.slug,
        city: assignedCity,
      });
    }

    // No match found
    return NextResponse.json({
      success: false,
      branchSlug: null,
      message: 'No branch found for this ZIP code or routing code',
    });
  } catch (error: any) {
    console.error('Resolve ZIP error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve ZIP code' },
      { status: 500 }
    );
  }
}

