import { NextRequest, NextResponse } from 'next/server';
import { calculateBookingQuoteAsync } from '@/lib/pricing/calculateQuote';
import type { BookingQuoteInput } from '@/lib/pricing/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BookingQuoteInput>;

    // Normalize booleans / numbers if needed
    const input: BookingQuoteInput = {
      serviceType: body.serviceType ?? null,
      branchSlug: body.branchSlug ?? null,
      home: {
        bedrooms: Number(body.home?.bedrooms ?? 0),
        bathrooms: Number(body.home?.bathrooms ?? 0),
        sqft: body.home?.sqft != null ? Number(body.home.sqft) : null,
        pets: Boolean(body.home?.pets),
      },
      schedule: {
        date: body.schedule?.date ?? null,
        timeSlot: body.schedule?.timeSlot ?? null,
      },
      extras: {
        insideFridge: Boolean(body.extras?.insideFridge),
        insideOven: Boolean(body.extras?.insideOven),
        insideCabinets: Boolean(body.extras?.insideCabinets),
        windows: Boolean(body.extras?.windows),
        laundry: Boolean(body.extras?.laundry),
        notes: body.extras?.notes ?? '',
      },
      promoCode: body.promoCode ?? null,
    };

    const { quote, errors } = await calculateBookingQuoteAsync(input);

    if (errors.length > 0 || !quote) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error in /api/booking/quote:', error);
    return NextResponse.json(
      { success: false, errors: [{ field: 'global', message: 'Failed to calculate quote' }] },
      { status: 500 },
    );
  }
}

















