export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      const serviceArea = await prisma.branchServiceArea.findFirst({
        where: {
          zipCode: normalizedZip,
          Branch: {
            slug: 'port-antonio',
            status: {
              in: ['ACTIVE', 'COMING_SOON'],
            },
          },
        },
        include: {
          Branch: {
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

      if (serviceArea?.Branch) {
        return NextResponse.json({
          success: true,
          branchSlug: serviceArea.Branch.slug,
        });
      }
    }

    // Standard ZIP code lookup for U.S. branches
    const serviceArea = await prisma.branchServiceArea.findFirst({
      where: {
        zipCode: normalizedZip,
        Branch: {
          status: 'ACTIVE',
        },
      },
      include: {
        Branch: {
          select: {
            slug: true,
            status: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    if (serviceArea?.Branch) {
      let assignedCity: string | null = null;
      if (serviceArea.Branch.slug === 'new-jersey') {
        assignedCity = resolveCityFromZip(normalizedZip);
      }

      return NextResponse.json({
        success: true,
        branchSlug: serviceArea.Branch.slug,
        city: assignedCity,
      });
    }

    return NextResponse.json({
      success: false,
      branchSlug: null,
      message: 'No branch found for this ZIP code or routing code',
    });
  } catch (error: unknown) {
    console.error('Resolve ZIP error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to resolve ZIP code';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
