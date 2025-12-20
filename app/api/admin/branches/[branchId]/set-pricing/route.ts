import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Set Multi-Currency Pricing API
 * 
 * POST /api/admin/branches/[slug]/set-pricing
 * 
 * Sets multi-currency pricing for Port Antonio service packages
 * Body: {
 *   pricing: { currency, basePrices, addons, usdEquivalents, quoteRequiredForLargeVillas },
 *   packages: Array<{ code, name, jmdPrice, usdPrice, hours }>
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const body = await request.json();
    const { pricing, packages } = body;

    if (!pricing || !packages || !Array.isArray(packages)) {
      return NextResponse.json(
        { success: false, error: 'pricing and packages are required' },
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

    const updatedPackages: string[] = [];

    // Update or create each service package
    for (const pkg of packages) {
      try {
        await prisma.branchServicePackage.upsert({
          where: {
            branchId_code: {
              branchId: branch.id,
              code: pkg.code,
            },
          },
          create: {
            branchId: branch.id,
            code: pkg.code,
            name: pkg.name,
            description: pkg.description || null,
            defaultDurationHours: pkg.hours,
            basePrice: pkg.jmdPrice, // Store JMD as base price
            currency: 'JMD',
            pricingData: {
              jmd: {
                base: pkg.jmdPrice,
              },
              usd: {
                base: pkg.usdPrice,
              },
              addons: pricing.addons,
              quoteRequiredForLargeVillas: pricing.quoteRequiredForLargeVillas,
            },
            isActive: true,
          },
          update: {
            name: pkg.name,
            description: pkg.description || null,
            defaultDurationHours: pkg.hours,
            basePrice: pkg.jmdPrice,
            currency: 'JMD',
            pricingData: {
              jmd: {
                base: pkg.jmdPrice,
              },
              usd: {
                base: pkg.usdPrice,
              },
              addons: pricing.addons,
              quoteRequiredForLargeVillas: pricing.quoteRequiredForLargeVillas,
            },
          },
        });
        updatedPackages.push(pkg.code);
      } catch (err: any) {
        console.error(`Error updating package ${pkg.code}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      updatedPackages,
      message: `Updated ${updatedPackages.length} service packages with multi-currency pricing`,
    });
  } catch (error: any) {
    console.error('Set pricing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set pricing' },
      { status: 500 }
    );
  }
}



