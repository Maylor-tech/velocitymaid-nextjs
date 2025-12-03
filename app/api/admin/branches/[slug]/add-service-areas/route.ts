import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Add Service Areas API
 * 
 * POST /api/admin/branches/[slug]/add-service-areas
 * 
 * Adds service areas (ZIP codes or routing codes) to a branch
 * Body: { zipCodes: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { slug } = params;
    const body = await request.json();
    const { zipCodes } = body;

    if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'zipCodes array is required' },
        { status: 400 }
      );
    }

    // Find branch
    const branch = await prisma.branch.findUnique({
      where: { slug },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Add service areas
    const addedCodes: string[] = [];
    const skippedCodes: string[] = [];

    for (const zipCode of zipCodes) {
      const normalizedZip = zipCode.trim().toUpperCase();
      
      try {
        await prisma.branchServiceArea.upsert({
          where: {
            branchId_zipCode: {
              branchId: branch.id,
              zipCode: normalizedZip,
            },
          },
          create: {
            branchId: branch.id,
            zipCode: normalizedZip,
            priority: 1,
          },
          update: {
            // Update existing if needed
            priority: 1,
          },
        });
        addedCodes.push(normalizedZip);
      } catch (err: any) {
        // Skip duplicates or other errors
        skippedCodes.push(normalizedZip);
        console.warn(`Skipped ${normalizedZip}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      addedCodes,
      skippedCodes,
      message: `Added ${addedCodes.length} service area(s). ${skippedCodes.length > 0 ? `${skippedCodes.length} skipped (may already exist).` : ''}`,
    });
  } catch (error: any) {
    console.error('Add service areas error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add service areas' },
      { status: 500 }
    );
  }
}


