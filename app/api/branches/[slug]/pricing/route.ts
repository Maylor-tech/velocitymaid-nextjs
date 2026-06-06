export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get Branch Pricing API
 * 
 * GET /api/branches/[slug]/pricing
 * 
 * Returns pricing information for a branch, including multi-currency support
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const branch = await prisma.branch.findUnique({
      where: { slug },
      include: {
        servicePackages: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Build pricing structure
    const pricing: {
      currency: string;
      supportsMultiCurrency: boolean;
      packages: Array<{
        code: string;
        name: string;
        jmdPrice?: number;
        usdPrice?: number;
        basePrice: number;
        hours: number;
      }>;
      addons: {
        laundry: number;
        fridge: number;
        oven: number;
        windows_per_room: number;
      };
      quoteRequiredForLargeVillas?: boolean;
    } = {
      currency: 'USD',
      supportsMultiCurrency: false,
      packages: [],
      addons: {
        laundry: 15,
        fridge: 25,
        oven: 30,
        windows_per_room: 20,
      },
    };

    // Check if this branch supports multi-currency (Port Antonio)
    const hasMultiCurrency = branch.slug === 'port-antonio';
    pricing.supportsMultiCurrency = hasMultiCurrency;
    pricing.currency = hasMultiCurrency ? 'JMD' : 'USD';

    // Process service packages
    for (const pkg of branch.servicePackages) {
      const packageData: any = {
        code: pkg.code,
        name: pkg.name,
        basePrice: Number(pkg.basePrice),
        hours: pkg.defaultDurationHours,
      };

      // If multi-currency, extract JMD and USD prices
      if (hasMultiCurrency && pkg.pricingData) {
        const pricingData = pkg.pricingData as any;
        if (pricingData.jmd?.base) {
          packageData.jmdPrice = pricingData.jmd.base;
        }
        if (pricingData.usd?.base) {
          packageData.usdPrice = pricingData.usd.base;
        }
        // Extract add-ons from first package (they should be the same)
        if (pricingData.addons) {
          pricing.addons = {
            laundry: pricingData.addons.laundry || 15,
            fridge: pricingData.addons.fridge || 25,
            oven: pricingData.addons.oven || 30,
            windows_per_room: pricingData.addons.windows_per_room || 20,
          };
        }
        if (pricingData.quoteRequiredForLargeVillas !== undefined) {
          pricing.quoteRequiredForLargeVillas = pricingData.quoteRequiredForLargeVillas;
        }
      }

      pricing.packages.push(packageData);
    }

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error: any) {
    console.error('Get branch pricing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

