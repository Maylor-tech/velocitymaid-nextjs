export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { calculateBookingQuoteAsync } from '@/lib/pricing/calculateQuote';
import {
  buildQuoteInputForEstimate,
  isPublicPricingAllowed,
  buildEstimateRange,
  CUSTOM_QUOTE_LABEL,
  ESTIMATE_RANGE_LABEL,
  type FastEstimateParams,
} from '@/lib/estimate/fastEstimate';

/**
 * POST /api/estimate/quick
 *
 * Minimal instant estimate: no schedule required. Returns a ballpark range for
 * public-pricing branches, or a "Custom quote" marker for quote-first markets
 * (New Jersey) — never a dollar amount for those.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const branchSlug: string | null = body.branchSlug ?? null;

    if (!branchSlug) {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      );
    }

    // Quote-first markets never publish a public dollar amount.
    if (!isPublicPricingAllowed(branchSlug)) {
      return NextResponse.json({
        success: true,
        pricingVisible: false,
        label: CUSTOM_QUOTE_LABEL,
      });
    }

    const params: FastEstimateParams = {
      branchSlug,
      serviceType: body.serviceType ?? null,
      bedrooms: Number(body.bedrooms ?? 0),
      bathrooms: Number(body.bathrooms ?? 0),
      pets: Boolean(body.pets),
      sqft: body.sqft != null ? Number(body.sqft) : null,
      frequency: body.frequency ?? null,
    };

    const { quote, errors } = await calculateBookingQuoteAsync(
      buildQuoteInputForEstimate(params)
    );

    if (errors.length > 0 || !quote) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // This endpoint returns an estimate range only — never a payable amount,
    // never a confirmed quote/invoice, and it never creates a Job.
    return NextResponse.json({
      success: true,
      pricingVisible: true,
      isEstimate: true,
      label: ESTIMATE_RANGE_LABEL,
      range: buildEstimateRange(quote.total, quote.currency),
      estimatedHours: quote.estimatedHours,
      recommendedCleaners: quote.recommendedCleaners,
    });
  } catch (error) {
    console.error('Error in /api/estimate/quick:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate estimate' },
      { status: 500 }
    );
  }
}
